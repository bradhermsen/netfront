using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Dapper;
using Microsoft.Data.SqlClient;
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

        public async Task CreateAuthUserAsync(AuthUser user)
        {
            using var conn = _connectionFactory.CreateConnection();

            string sql = @"
                INSERT INTO AuthUsers (Id, Email, PasswordHash, Role, IsActive, CreatedAt)
                VALUES (@Id, @Email, @PasswordHash, @Role, @IsActive, SYSUTCDATETIME());
            ";

            await conn.ExecuteAsync(sql, user);
        }

        public async Task UpdateAuthUserAsync(string email, string role, bool isActive)
        {
            using var conn = _connectionFactory.CreateConnection();

            string sql = @"
                UPDATE AuthUsers
                SET Role = @Role,
                    IsActive = @IsActive
                WHERE Email = @Email;
            ";

            await conn.ExecuteAsync(sql, new { Email = email, Role = role, IsActive = isActive });
        }

        public async Task UpdatePasswordAsync(string email, string passwordHash)
        {
            using var conn = _connectionFactory.CreateConnection();

            string sql = @"
                UPDATE AuthUsers
                SET PasswordHash = @PasswordHash
                WHERE Email = @Email;
            ";

            await conn.ExecuteAsync(sql, new { Email = email, PasswordHash = passwordHash });
        }

        public async Task DeleteAuthUserAsync(string email)
        {
            using var conn = _connectionFactory.CreateConnection();

            await conn.ExecuteAsync(
                "DELETE FROM AuthUsers WHERE Email = @Email",
                new { Email = email }
            );
        }

        // ============================================================
        // USER PROFILES
        // ============================================================
        public async Task CreateUserProfileAsync(User profile)
        {
            using var conn = _connectionFactory.CreateConnection();

            string sql = @"
                INSERT INTO Users (Id, OrganizationId, FirstName, LastName, Email, Role, IsActive, CreatedAt)
                VALUES (@Id, @OrganizationId, @FirstName, @LastName, @Email, @Role, @IsActive, SYSUTCDATETIME());
            ";

            await conn.ExecuteAsync(sql, profile);
        }

        public async Task<IEnumerable<User>> GetAllUsersAsync()
        {
            using var conn = _connectionFactory.CreateConnection();

            string sql = @"
                SELECT 
                    Id,
                    OrganizationId,
                    FirstName,
                    LastName,
                    Email,
                    Role,
                    IsActive,
                    CreatedAt
                FROM Users
                ORDER BY LastName, FirstName;
            ";

            return await conn.QueryAsync<User>(sql);
        }

        public async Task<User?> GetUserByIdAsync(Guid id)
        {
            using var conn = _connectionFactory.CreateConnection();

            string sql = @"
                SELECT 
                    Id,
                    OrganizationId,
                    FirstName,
                    LastName,
                    Email,
                    Role,
                    IsActive,
                    CreatedAt
                FROM Users
                WHERE Id = @Id;
            ";

            return await conn.QueryFirstOrDefaultAsync<User>(sql, new { Id = id });
        }

        public async Task UpdateUserProfileAsync(
            Guid id,
            string firstName,
            string lastName,
            string email,
            string role,
            Guid? organizationId,
            bool isActive)
        {
            using var conn = _connectionFactory.CreateConnection();

            string sql = @"
                UPDATE Users
                SET 
                    FirstName = @FirstName,
                    LastName = @LastName,
                    Email = @Email,
                    Role = @Role,
                    OrganizationId = @OrganizationId,
                    IsActive = @IsActive
                WHERE Id = @Id;
            ";

            await conn.ExecuteAsync(sql, new
            {
                Id = id,
                FirstName = firstName,
                LastName = lastName,
                Email = email,
                Role = role,
                OrganizationId = organizationId,
                IsActive = isActive
            });
        }

        public async Task<string?> GetEmailByUserIdAsync(Guid id)
        {
            using var conn = _connectionFactory.CreateConnection();

            return await conn.QueryFirstOrDefaultAsync<string>(
                "SELECT Email FROM Users WHERE Id = @Id",
                new { Id = id }
            );
        }

        public async Task DeleteUserProfileAsync(Guid id)
        {
            using var conn = _connectionFactory.CreateConnection();

            await conn.ExecuteAsync(
                "DELETE FROM Users WHERE Id = @Id",
                new { Id = id }
            );
        }
    }
}
