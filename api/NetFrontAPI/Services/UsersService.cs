using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Dapper;
using BCrypt.Net;
using NetFrontAPI.Models;
using NetFrontAPI.Repositories;
using NetFrontAPI.Infrastructure.Database;

namespace NetFrontAPI.Services
{
    public class UsersService : IUsersService
    {
        private readonly IUsersRepository _repo;
        private readonly ISqlConnectionFactory _connectionFactory;

        public UsersService(IUsersRepository repo, ISqlConnectionFactory connectionFactory)
        {
            _repo = repo;
            _connectionFactory = connectionFactory;
        }

        // ============================================================
        // CREATE USER (AuthUsers + Users) - RETURNS CREATED USER
        // ============================================================
        public async Task<User> CreateUserAsync(
            string email,
            string password,
            string role,
            Guid? organizationId,
            string firstName,
            string lastName)
        {
            // Prevent duplicates
            var existing = await _repo.GetAuthUserByEmailAsync(email);
            if (existing != null)
                throw new InvalidOperationException("User already exists.");

            // Build AuthUser
            var authUser = new AuthUser
            {
                Id = Guid.NewGuid(),
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                Role = role,
                IsActive = true
            };

            // Build User profile
            var profile = new User
            {
                Id = Guid.NewGuid(),
                OrganizationId = organizationId,
                FirstName = firstName,
                LastName = lastName,
                Email = email
            };

            // Create both records
            await _repo.CreateLinkedUserAsync(authUser, profile);

            // ⭐ Return the created user profile
            return profile;
        }

        // ============================================================
        // CREATE USER WITH PRE-HASHED PASSWORD (OrgOwner)
        // RETURNS CREATED USER
        // ============================================================
        public async Task<User> CreateUserWithHashAsync(
            string email,
            string passwordHash,
            string role,
            Guid? organizationId,
            string firstName,
            string lastName)
        {
            // Prevent duplicates
            var existing = await _repo.GetAuthUserByEmailAsync(email);
            if (existing != null)
                throw new InvalidOperationException("User already exists.");

            // Build AuthUser
            var authUser = new AuthUser
            {
                Id = Guid.NewGuid(),
                Email = email,
                PasswordHash = passwordHash,
                Role = role,
                IsActive = true
            };

            // Build User profile
            var profile = new User
            {
                Id = Guid.NewGuid(),
                OrganizationId = organizationId,
                FirstName = firstName,
                LastName = lastName,
                Email = email
            };

            // Create both records
            await _repo.CreateLinkedUserAsync(authUser, profile);

            // ⭐ Return created profile
            return profile;
        }

        // ============================================================
        // GET ALL USERS
        // ============================================================
        public Task<IEnumerable<User>> GetAllAsync()
        {
            return _repo.GetAllUsersAsync();
        }

        // ============================================================
        // GET USER BY ID
        // ============================================================
        public Task<User?> GetByIdAsync(Guid id)
        {
            return _repo.GetUserByIdAsync(id);
        }

        // ============================================================
        // UPDATE USER (AuthUsers + Users)
        // ============================================================
        public async Task UpdateUserAsync(
            Guid id,
            string email,
            string firstName,
            string lastName,
            Guid? organizationId,
            string role,
            bool isActive,
            string? password)
        {
            await _repo.UpdateLinkedUserAsync(
                id,
                email,
                firstName,
                lastName,
                organizationId,
                role,
                isActive,
                password
            );
        }

        // ============================================================
        // RESET PASSWORD
        // ============================================================
        public async Task ResetPasswordAsync(Guid id, string newPassword)
        {
            var email = await _repo.GetEmailByUserIdAsync(id);
            if (email == null)
                throw new InvalidOperationException("User not found.");

            var hash = BCrypt.Net.BCrypt.HashPassword(newPassword);

            using var conn = _connectionFactory.CreateConnection();
            using var tx = conn.BeginTransaction();

            await conn.ExecuteAsync(
                "UPDATE AuthUsers SET PasswordHash = @Hash WHERE Email = @Email",
                new { Hash = hash, Email = email },
                tx
            );

            tx.Commit();
        }

        // ============================================================
        // GET USER BY EMAIL
        // ============================================================
        public Task<User?> GetByEmailAsync(string email)
        {
            return _repo.GetUserByEmailAsync(email);
        }

        // ============================================================
        // UPDATE PASSWORD HASH
        // ============================================================
        public Task UpdatePasswordHashAsync(Guid id, string passwordHash)
        {
            return _repo.UpdatePasswordHashAsync(id, passwordHash);
        }

        // ============================================================
        // DELETE USER
        // ============================================================
        public Task DeleteUserAsync(Guid id)
        {
            return _repo.DeleteLinkedUserAsync(id);
        }
    }
}
