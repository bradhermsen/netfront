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
        // AUTH USERS
        // ============================================================

        Task<AuthUser?> GetAuthUserByEmailAsync(string email);

        Task CreateAuthUserAsync(AuthUser user, IDbTransaction tx);

        Task UpdateAuthUserAsync(string email, string role, bool isActive, IDbTransaction tx);

        Task UpdatePasswordAsync(string email, string passwordHash, IDbTransaction tx);

        Task DeleteAuthUserAsync(string email, IDbTransaction tx);

        // ============================================================
        // USER PROFILES
        // ============================================================

        Task CreateUserProfileAsync(User profile, IDbTransaction tx);

        // ============================================================
        // LINKED OPERATIONS (AuthUsers + Users)
        // ============================================================

        /// <summary>
        /// Creates both AuthUser and User profile in a single transaction.
        /// Supports plaintext password (hashed inside service).
        /// </summary>
        Task CreateLinkedUserAsync(AuthUser authUser, User profile);

        /// <summary>
        /// Creates both AuthUser and User profile using a pre-hashed password.
        /// Used for OrgOwner auto-creation.
        /// </summary>
        Task CreateLinkedUserWithHashAsync(AuthUser authUser, User profile);

        Task UpdateLinkedUserAsync(
            Guid id,
            string email,
            string firstName,
            string lastName,
            Guid? organizationId,
            string role,
            bool isActive,
            string? password);

        Task DeleteLinkedUserAsync(Guid id);

        // ============================================================
        // READ OPERATIONS
        // ============================================================

        Task<IEnumerable<User>> GetAllUsersAsync();

        Task<User?> GetUserByIdAsync(Guid id);

        Task<string?> GetEmailByUserIdAsync(Guid id);
    }
}
