using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using NetFrontAPI.Infrastructure.Database;
using NetFrontAPI.Models;

namespace NetFrontAPI.Repositories
{
    public class UsersRepository : IUsersRepository
    {
        private readonly ISqlConnectionFactory _connectionFactory;

        public UsersRepository(ISqlConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        // ============================================================
        // AUTH USERS
        // ============================================================
        public async Task<AuthUser?> GetAuthUserByEmailAsync(string email)
        {
            using var conn = _connectionFactory.CreateConnection();

            return await conn.QueryFirstOrDefaultAsync<AuthUser>(
                "SELECT * FROM AuthUsers WHERE Email = @Email",
                new { Email = email }
            );
        }

        public async Task CreateAuthUserAsync(AuthUser user, IDbTransaction tx)
        {
            string sql = @"
                INSERT INTO AuthUsers (Id, Email, PasswordHash, Role, IsActive, CreatedAt)
                VALUES (@Id, @Email, @PasswordHash, @Role, @IsActive, SYSUTCDATETIME());
            ";

            await tx.Connection.ExecuteAsync(sql, user, tx);
        }

        public async Task UpdateAuthUserAsync(string email, string role, bool isActive, IDbTransaction tx)
        {
            string sql = @"
                UPDATE AuthUsers
                SET Role = @Role,
                    IsActive = @IsActive
                WHERE Email = @Email;
            ";

            await tx.Connection.ExecuteAsync(sql, new { Email = email, Role = role, IsActive = isActive }, tx);
        }

        public async Task UpdatePasswordAsync(string email, string passwordHash, IDbTransaction tx)
        {
            string sql = @"
                UPDATE AuthUsers
                SET PasswordHash = @PasswordHash
                WHERE Email = @Email;
            ";

            await tx.Connection.ExecuteAsync(sql, new { Email = email, PasswordHash = passwordHash }, tx);
        }

        public async Task DeleteAuthUserAsync(string email, IDbTransaction tx)
        {
            await tx.Connection.ExecuteAsync(
                "DELETE FROM AuthUsers WHERE Email = @Email",
                new { Email = email },
                tx
            );
        }

        // ============================================================
        // USER PROFILES
        // ============================================================
        public async Task CreateUserProfileAsync(User profile, IDbTransaction tx)
        {
            string sql = @"
                INSERT INTO Users (Id, OrganizationId, FirstName, LastName, Email, CreatedAt)
                VALUES (@Id, @OrganizationId, @FirstName, @LastName, @Email, SYSUTCDATETIME());
            ";

            await tx.Connection.ExecuteAsync(sql, profile, tx);
        }

        // ============================================================
        // LINKED OPERATIONS (AuthUsers + Users)
        // ============================================================
        public async Task CreateLinkedUserAsync(AuthUser authUser, User profile)
        {
            using var conn = _connectionFactory.CreateConnection();
            using var tx = conn.BeginTransaction();

            await CreateAuthUserAsync(authUser, tx);
            await CreateUserProfileAsync(profile, tx);

            tx.Commit();
        }

        public async Task CreateLinkedUserWithHashAsync(AuthUser authUser, User profile)
        {
            using var conn = _connectionFactory.CreateConnection();
            using var tx = conn.BeginTransaction();

            await CreateAuthUserAsync(authUser, tx);
            await CreateUserProfileAsync(profile, tx);

            tx.Commit();
        }

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
            using var conn = _connectionFactory.CreateConnection();
            using var tx = conn.BeginTransaction();

            string profileSql = @"
                UPDATE Users
                SET FirstName = @FirstName,
                    LastName = @LastName,
                    OrganizationId = @OrganizationId
                WHERE Id = @Id;
            ";

            await conn.ExecuteAsync(profileSql, new
            {
                Id = id,
                FirstName = firstName,
                LastName = lastName,
                OrganizationId = organizationId
            }, tx);

            await UpdateAuthUserAsync(email, role, isActive, tx);

            if (!string.IsNullOrWhiteSpace(password))
            {
                await UpdatePasswordAsync(email, password, tx);
            }

            tx.Commit();
        }

        public async Task DeleteLinkedUserAsync(Guid id)
        {
            using var conn = _connectionFactory.CreateConnection();
            using var tx = conn.BeginTransaction();

            var email = await conn.QueryFirstOrDefaultAsync<string>(
                "SELECT Email FROM Users WHERE Id = @Id",
                new { Id = id },
                tx
            );

            if (email != null)
            {
                await conn.ExecuteAsync("DELETE FROM Users WHERE Id = @Id", new { Id = id }, tx);
                await conn.ExecuteAsync("DELETE FROM AuthUsers WHERE Email = @Email", new { Email = email }, tx);
            }

            tx.Commit();
        }

        // ============================================================
        // TEAMS FOR USER
        // ============================================================
        public async Task<IEnumerable<string>> GetTeamsForUserAsync(Guid userId)
        {
            using var conn = _connectionFactory.CreateConnection();

            string sql = @"
                SELECT t.Name
                FROM Teams t
                INNER JOIN RosterEntries r ON r.TeamId = t.Id
                WHERE r.PlayerId = @UserId;
            ";

            return await conn.QueryAsync<string>(sql, new { UserId = userId });
        }

        // ============================================================
        // READ OPERATIONS
        // ============================================================
        public async Task<IEnumerable<User>> GetAllUsersAsync()
        {
            using var conn = _connectionFactory.CreateConnection();

            string sql = @"
                SELECT 
                    u.Id,
                    u.OrganizationId,
                    o.Name AS OrganizationName,
                    u.FirstName,
                    u.LastName,
                    u.Email,
                    u.CreatedAt,
                    au.Role,
                    au.IsActive
                FROM Users u
                INNER JOIN AuthUsers au ON u.Email = au.Email
                LEFT JOIN Organizations o ON u.OrganizationId = o.OrganizationId
                ORDER BY u.LastName, u.FirstName;
            ";

            var users = (await conn.QueryAsync<User>(sql)).ToList();

            foreach (var u in users)
            {
                var teams = await GetTeamsForUserAsync(u.Id);
                u.Teams = teams.ToList();
            }

            return users;
        }

        public async Task<User?> GetUserByIdAsync(Guid id)
        {
            using var conn = _connectionFactory.CreateConnection();

            string sql = @"
                SELECT 
                    u.Id,
                    u.OrganizationId,
                    o.Name AS OrganizationName,
                    u.FirstName,
                    u.LastName,
                    u.Email,
                    u.CreatedAt,
                    au.Role,
                    au.IsActive
                FROM Users u
                INNER JOIN AuthUsers au ON u.Email = au.Email
                LEFT JOIN Organizations o ON u.OrganizationId = o.OrganizationId
                WHERE u.Id = @Id;
            ";

            var user = await conn.QueryFirstOrDefaultAsync<User>(sql, new { Id = id });
            if (user == null)
                return null;

            var teams = await GetTeamsForUserAsync(id);
            user.Teams = teams.ToList();

            return user;
        }

        public async Task<string?> GetEmailByUserIdAsync(Guid id)
        {
            using var conn = _connectionFactory.CreateConnection();

            return await conn.QueryFirstOrDefaultAsync<string>(
                "SELECT Email FROM Users WHERE Id = @Id",
                new { Id = id }
            );
        }
    }
}
