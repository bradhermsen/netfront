using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NetFrontAPI.Models;

namespace NetFrontAPI.Repositories
{
    public interface IUsersRepository
    {
        Task<AuthUser?> GetAuthUserByEmailAsync(string email);
        Task CreateAuthUserAsync(AuthUser user);

        Task CreateUserProfileAsync(User profile);
        Task<IEnumerable<User>> GetAllUsersAsync();
        Task<User?> GetUserByIdAsync(Guid id);

        Task UpdateUserProfileAsync(
            Guid id,
            string firstName,
            string lastName,
            string email,
            string role,
            Guid? organizationId,
            bool isActive
        );

        Task UpdateAuthUserAsync(
            string email,
            string role,
            bool isActive
        );

        Task UpdatePasswordAsync(string email, string passwordHash);

        Task<string?> GetEmailByUserIdAsync(Guid id);

        Task DeleteUserProfileAsync(Guid id);
        Task DeleteAuthUserAsync(string email);
    }
}
