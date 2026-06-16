using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using BCrypt.Net;
using NetFrontAPI.Models;
using NetFrontAPI.Repositories;

namespace NetFrontAPI.Services
{
    public class UsersService : IUsersService
    {
        private readonly IUsersRepository _repo;

        public UsersService(IUsersRepository repo)
        {
            _repo = repo;
        }

        // ============================================================
        // CREATE USER
        // ============================================================
        public async Task CreateUserAsync(
            string email,
            string password,
            string role,
            Guid? organizationId,
            string firstName,
            string lastName)
        {
            var existing = await _repo.GetAuthUserByEmailAsync(email);
            if (existing != null)
                throw new InvalidOperationException("User already exists.");

            var authUser = new AuthUser
            {
                Id = Guid.NewGuid(),
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                Role = role,
                IsActive = true
            };

            await _repo.CreateAuthUserAsync(authUser);

            var profile = new User
            {
                Id = Guid.NewGuid(),
                OrganizationId = organizationId,
                FirstName = firstName,
                LastName = lastName,
                Email = email,
                Role = role,
                IsActive = true
            };

            await _repo.CreateUserProfileAsync(profile);
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
        // UPDATE USER
        // ============================================================
        public async Task UpdateUserAsync(
            Guid id,
            string email,
            string password,
            string role,
            Guid? organizationId,
            string firstName,
            string lastName,
            bool isActive)
        {
            // Update profile
            await _repo.UpdateUserProfileAsync(
                id,
                firstName,
                lastName,
                email,
                role,
                organizationId,
                isActive
            );

            // Update auth record
            await _repo.UpdateAuthUserAsync(
                email,
                role,
                isActive
            );

            // Optional password update
            if (!string.IsNullOrWhiteSpace(password))
            {
                await _repo.UpdatePasswordAsync(
                    email,
                    BCrypt.Net.BCrypt.HashPassword(password)
                );
            }
        }

        // ============================================================
        // DELETE USER
        // ============================================================
        public async Task DeleteUserAsync(Guid id)
        {
            var email = await _repo.GetEmailByUserIdAsync(id);
            if (email == null)
                throw new InvalidOperationException("User not found.");

            await _repo.DeleteUserProfileAsync(id);
            await _repo.DeleteAuthUserAsync(email);
        }
    }
}
