using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using NetFrontAPI.Models;

namespace NetFrontAPI.Repositories
{
    public interface IUsersRepository
    {
        Task<AuthUser?> GetAuthUserByEmailAsync(string email);

        Task CreateAuthUserAsync(AuthUser user, IDbTransaction tx);
        Task DeleteAuthUserAsync(string email, IDbTransaction tx);

        Task CreateUserProfileAsync(User profile, IDbTransaction tx);

        Task CreateLinkedUserAsync(AuthUser authUser, User profile);
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

        Task<IEnumerable<User>> GetAllUsersAsync();
        Task<User?> GetUserByIdAsync(Guid id);
        Task<string?> GetEmailByUserIdAsync(Guid id);
    }
}
