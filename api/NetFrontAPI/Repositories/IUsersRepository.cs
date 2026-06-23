using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using NetFrontAPI.Models;

namespace NetFrontAPI.Repositories
{
    public interface IUsersRepository
    {
        // ============================================================
        // AUTH USERS LOOKUP
        // ============================================================
        Task<AuthUser?> GetAuthUserByEmailAsync(string email);

        // ============================================================
        // LOW-LEVEL CREATION (used inside CreateLinkedUserAsync)
        // ============================================================
        Task CreateAuthUserAsync(AuthUser user, IDbTransaction tx);
        Task DeleteAuthUserAsync(string email, IDbTransaction tx);

        Task CreateUserProfileAsync(User profile, IDbTransaction tx);

        // ============================================================
        // HIGH-LEVEL CREATION (transaction wrapper)
        // ============================================================
        Task CreateLinkedUserAsync(AuthUser authUser, User profile);
        Task CreateLinkedUserWithHashAsync(AuthUser authUser, User profile);

        // ============================================================
        // UPDATE USER (AuthUsers + Users)
        // ============================================================
        Task UpdateLinkedUserAsync(
            Guid id,
            string email,
            string firstName,
            string lastName,
            Guid? organizationId,
            string role,
            bool isActive,
            string? password);

        // ============================================================
        // DELETE USER (AuthUsers + Users)
        // ============================================================
        Task DeleteLinkedUserAsync(Guid id);

        // ============================================================
        // QUERIES
        // ============================================================
        Task<IEnumerable<User>> GetAllUsersAsync();
        Task<User?> GetUserByIdAsync(Guid id);
        Task<string?> GetEmailByUserIdAsync(Guid id);

        // ⭐ REQUIRED FOR TEAMS AUTO‑COACH CREATION
        Task<User?> GetUserByEmailAsync(string email);

        // ⭐ REQUIRED FOR RESET PASSWORD + AUTO‑COACH CREATION
        Task UpdatePasswordHashAsync(Guid id, string passwordHash);
    }
}
