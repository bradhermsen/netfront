using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using NetFrontAPI.Infrastructure.Database;
using NetFrontAPI.Models;
using NetFrontAPI.DTOs;
using NetFrontAPI.Repositories;

namespace NetFrontAPI.Repositories
{
    public class UsersRepository : IUsersRepository
    {
        private readonly ISqlConnectionFactory _db;
        private readonly ICoachTeamsRepository _coachTeamsRepository;

        public UsersRepository(
            ISqlConnectionFactory db,
            ICoachTeamsRepository coachTeamsRepository)
        {
            _db = db;
            _coachTeamsRepository = coachTeamsRepository;
        }


        // ============================================================
        // CREATE (standalone)
        // ============================================================
        public async Task CreateLinkedUserAsync(AuthUser auth, User profile)
        {
            using var conn = _db.CreateConnection();
            using var tx = conn.BeginTransaction();

            await CreateLinkedUserAsync(auth, profile, conn, tx);

            tx.Commit();
        }

        // ============================================================
        // CREATE (transactional)
        // ============================================================
        public async Task CreateLinkedUserAsync(AuthUser auth, User profile, IDbConnection conn, IDbTransaction tx)
        {
            const string sqlAuth = @"
                INSERT INTO AuthUsers (Id, Email, PasswordHash, Role, IsActive, CreatedAt)
                VALUES (@Id, @Email, @PasswordHash, @Role, @IsActive, @CreatedAt);";

            const string sqlUser = @"
                INSERT INTO Users (Id, OrganizationId, FirstName, LastName, Email, CreatedAt)
                VALUES (@Id, @OrganizationId, @FirstName, @LastName, @Email, @CreatedAt);";

            await conn.ExecuteAsync(sqlAuth, auth, tx);
            await conn.ExecuteAsync(sqlUser, profile, tx);
        }

        // ============================================================
        // UPDATE (standalone)
        // ============================================================
        public async Task UpdateLinkedUserAsync(
            Guid id,
            string email,
            string firstName,
            string lastName,
            Guid? organizationId,
            string role,
            bool isActive,
            string? password)
        {
            using var conn = _db.CreateConnection();
            using var tx = conn.BeginTransaction();

            await UpdateLinkedUserAsync(id, email, firstName, lastName, organizationId, role, isActive, password, conn, tx);

            tx.Commit();
        }


        // ============================================================
        // UPDATE (transactional) — Unified ID Model
        // ============================================================
        public async Task UpdateLinkedUserAsync(
            Guid id,
            string email,
            string firstName,
            string lastName,
            Guid? organizationId,
            string role,
            bool isActive,
            string? password,
            IDbConnection conn,
            IDbTransaction tx)
        {
            // Get original email (needed for AuthUsers update)
            const string sqlGetEmail = @"SELECT Email FROM Users WHERE Id = @Id;";
            var originalEmail = await conn.ExecuteScalarAsync<string>(sqlGetEmail, new { Id = id }, tx);

            if (originalEmail == null)
                throw new InvalidOperationException("User not found.");

            // Update Users table
            const string sqlUser = @"
                UPDATE Users
                SET FirstName = @FirstName,
                    LastName = @LastName,
                    OrganizationId = @OrganizationId,
                    Email = @Email
                WHERE Id = @Id;";

            await conn.ExecuteAsync(sqlUser, new
            {
                Id = id,
                FirstName = firstName,
                LastName = lastName,
                OrganizationId = organizationId,
                Email = email
            }, tx);

            // Update AuthUsers using ORIGINAL email
            const string sqlAuth = @"
                UPDATE AuthUsers
                SET Email = @NewEmail,
                    Role = @Role,
                    IsActive = @IsActive
                WHERE Id = @Id;";

            await conn.ExecuteAsync(sqlAuth, new
            {
                Id = id,
                NewEmail = email,
                Role = role,
                IsActive = isActive
            }, tx);

            // Update password if provided
            if (!string.IsNullOrWhiteSpace(password))
            {
                const string sqlPass = @"
                    UPDATE AuthUsers
                    SET PasswordHash = @PasswordHash
                    WHERE Id = @Id;";

                await conn.ExecuteAsync(sqlPass, new
                {
                    Id = id,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(password)
                }, tx);
            }
        }


        public async Task<IEnumerable<UserListItemDto>> GetAllUsersAsync()
        {
            using var conn = _db.CreateConnection();

            var sql = @"
                SELECT
                    u.Id,
                    u.OrganizationId,
                    u.FirstName,
                    u.LastName,
                    u.Email,
                    u.CreatedAt,

                    au.Role,
                    au.IsActive,

                    o.Name AS OrganizationName,

                    t.Id AS TeamId,
                    t.Name AS TeamName,
                    t.Abbreviation

                FROM Users u
                LEFT JOIN AuthUsers au ON au.Id = u.Id
                LEFT JOIN Organizations o ON o.OrganizationId = u.OrganizationId
                LEFT JOIN CoachTeams ct ON ct.UserId = u.Id
                LEFT JOIN Teams t ON t.Id = ct.TeamId

                ORDER BY u.LastName, u.FirstName;
            ";

            var lookup = new Dictionary<Guid, UserListItemDto>();

            // ===============================
            // DAPPER MULTI-MAPPING
            // ===============================
            await conn.QueryAsync<UserListItemDto, TeamSummaryDto, UserListItemDto>(
                sql,
                (user, team) =>
                {
                    if (!lookup.TryGetValue(user.Id, out var dto))
                    {
                        dto = user;
                        dto.Teams = new List<TeamSummaryDto>();
                        lookup.Add(dto.Id, dto);
                    }

                    if (team != null && team.TeamId != Guid.Empty)
                    {
                        dto.Teams.Add(team);
                    }

                    return dto;
                },
                splitOn: "TeamId"
            );

            // ===============================
            // APPLY BUSINESS RULES
            // ===============================
            var users = lookup.Values.ToList();

            foreach (var user in users)
            {
                // Admin → no teams
                if (user.Role == "Admin")
                {
                    user.Teams = new List<TeamSummaryDto>();
                    continue;
                }

                // OrgOwner → all teams in their organization
                if (user.Role == "OrgOwner" && user.OrganizationId != null)
                {
                    var orgTeams = await conn.QueryAsync<TeamSummaryDto>(
                        @"SELECT 
                            Id AS TeamId,
                            Name AS TeamName,
                            Abbreviation
                        FROM Teams
                        WHERE OrganizationId = @OrgId;",
                        new { OrgId = user.OrganizationId }
                    );

                    user.Teams = orgTeams.ToList();
                    continue;
                }

                // Coach → keep SQL‑mapped teams (already correct)
            }

            return users;
        }




        // ============================================================
        // GET USER BY ID — Unified ID Model + Teams + Auth Info
        // ============================================================
        public async Task<UserListItemDto?> GetUserByIdAsync(Guid id)
        {
            using var conn = _db.CreateConnection();

            // 1. Load profile row
            var user = await conn.QueryFirstOrDefaultAsync<User>(
                "SELECT * FROM Users WHERE Id = @Id;",
                new { Id = id }
            );

            if (user == null)
                return null;

            // 2. Load auth row (same ID now)
            var auth = await conn.QueryFirstOrDefaultAsync<AuthUser>(
                "SELECT * FROM AuthUsers WHERE Id = @Id;",
                new { Id = id }
            );

            // 3. Load organization name
            var orgName = await conn.ExecuteScalarAsync<string?>(
                "SELECT Name FROM Organizations WHERE OrganizationId = @OrgId;",
                new { OrgId = user.OrganizationId }
            );

            // 4. Load teams
            var teams = await _coachTeamsRepository.GetTeamsForCoachAsync(id);

            var teamDtos = teams.Select(t => new TeamSummaryDto
            {
                TeamId = t.TeamId,
                TeamName = t.TeamName,
                Abbreviation = t.Abbreviation
            }).ToList();

            // 5. Build DTO for UI
            return new UserListItemDto
            {
                Id = user.Id,
                OrganizationId = user.OrganizationId,
                OrganizationName = orgName,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                CreatedAt = user.CreatedAt,
                Role = auth?.Role ?? "None",
                IsActive = auth?.IsActive ?? false,
                Teams = teamDtos
            };
        }


        public async Task<User?> GetUserByEmailAsync(string email)
        {
            using var conn = _db.CreateConnection();
            return await conn.QueryFirstOrDefaultAsync<User>(
                "SELECT * FROM Users WHERE Email = @Email;",
                new { Email = email }
            );
        }

        public async Task<AuthUser?> GetAuthUserByEmailAsync(string email)
        {
            using var conn = _db.CreateConnection();
            return await conn.QueryFirstOrDefaultAsync<AuthUser>(
                "SELECT * FROM AuthUsers WHERE Email = @Email;",
                new { Email = email }
            );
        }

        public async Task<string?> GetEmailByUserIdAsync(Guid id)
        {
            using var conn = _db.CreateConnection();
            return await conn.ExecuteScalarAsync<string?>(
                "SELECT Email FROM Users WHERE Id = @Id;",
                new { Id = id }
            );
        }

        public async Task UpdatePasswordHashAsync(Guid id, string passwordHash)
        {
            using var conn = _db.CreateConnection();
            await conn.ExecuteAsync(
                "UPDATE AuthUsers SET PasswordHash = @Hash WHERE Id = @Id;",
                new { Id = id, Hash = passwordHash }
            );
        }

        // ============================================================
        // DELETE (Unified ID Model)
        // ============================================================
        public async Task DeleteLinkedUserAsync(Guid id)
        {
            using var conn = _db.CreateConnection();
            using var tx = conn.BeginTransaction();

            // Remove team assignments first (FK safety)
            const string sqlTeams = @"DELETE FROM CoachTeams WHERE UserId = @Id;";
            await conn.ExecuteAsync(sqlTeams, new { Id = id }, tx);

            // Delete profile
            const string sqlUser = @"DELETE FROM Users WHERE Id = @Id;";
            await conn.ExecuteAsync(sqlUser, new { Id = id }, tx);

            // Delete auth row
            const string sqlAuth = @"DELETE FROM AuthUsers WHERE Id = @Id;";
            await conn.ExecuteAsync(sqlAuth, new { Id = id }, tx);

            tx.Commit();
        }

    }
}
