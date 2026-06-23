using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NetFrontAPI.Models;

namespace NetFrontAPI.Services
{
    public interface IUsersService
    {
        // ============================================================
        // CREATE USER — RETURNS CREATED USER
        // ============================================================
        Task<User> CreateUserAsync(
            string email,
            string password,
            string role,
            Guid? organizationId,
            string firstName,
            string lastName);

        // ============================================================
        // CREATE USER WITH PRE-HASHED PASSWORD — RETURNS CREATED USER
        // ============================================================
        Task<User> CreateUserWithHashAsync(
            string email,
            string passwordHash,
            string role,
            Guid? organizationId,
            string firstName,
            string lastName);

        // ============================================================
        // GET ALL USERS
        // ============================================================
        Task<IEnumerable<User>> GetAllAsync();

        // ============================================================
        // GET USER BY ID
        // ============================================================
        Task<User?> GetByIdAsync(Guid id);

        // ============================================================
        // GET USER BY EMAIL
        // ============================================================
        Task<User?> GetByEmailAsync(string email);

        // ============================================================
        // UPDATE USER
        // ============================================================
        Task UpdateUserAsync(
            Guid id,
            string email,
            string firstName,
            string lastName,
            Guid? organizationId,
            string role,
            bool isActive,
            string? password);

        // ============================================================
        // RESET PASSWORD
        // ============================================================
        Task ResetPasswordAsync(Guid id, string newPassword);

        // ============================================================
        // UPDATE PASSWORD HASH
        // ============================================================
        Task UpdatePasswordHashAsync(Guid id, string passwordHash);

        // ============================================================
        // DELETE USER
        // ============================================================
        Task DeleteUserAsync(Guid id);
    }
}
