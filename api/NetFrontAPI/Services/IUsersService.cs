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
            string lastName
        );

        Task<IEnumerable<User>> GetAllAsync();
        Task<User?> GetByIdAsync(Guid id);

        Task UpdateUserAsync(
            Guid id,
            string email,
            string password,
            string role,
            Guid? organizationId,
            string firstName,
            string lastName,
            bool isActive
        );

        Task DeleteUserAsync(Guid id);
    }
}
