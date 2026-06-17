using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NetFrontAPI.Models;

namespace NetFrontAPI.Services
{
    public interface IUsersService
    {
        Task CreateUserAsync(
            string email,
            string password,
            string role,
            Guid? organizationId,
            string firstName,
            string lastName);

        // ⭐ NEW: Create a user when the password is already hashed (used for OrgOwner auto‑creation)
        Task CreateUserWithHashAsync(
            string email,
            string passwordHash,
            string role,
            Guid? organizationId,
            string firstName,
            string lastName);

        Task<IEnumerable<User>> GetAllAsync();

        Task<User?> GetByIdAsync(Guid id);

        Task UpdateUserAsync(
            Guid id,
            string email,
            string firstName,
            string lastName,
            Guid? organizationId,
            string role,
            bool isActive,
            string? password);

        Task DeleteUserAsync(Guid id);

        Task ResetPasswordAsync(Guid id, string newPassword);
    }
}
