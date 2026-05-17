using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NetFrontAPI.Models;

namespace NetFrontAPI.Repositories
{
    public interface IOrganizationRepository
    {
        Task<IEnumerable<Organization>> GetAllAsync();
        Task<Organization?> GetByIdAsync(Guid id);
        Task CreateAsync(Organization org);
        Task UpdateAsync(Organization org);
        Task DeleteAsync(Guid id);
    }
}
