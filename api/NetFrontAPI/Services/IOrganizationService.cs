using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NetFrontAPI.DTOs;

namespace NetFrontAPI.Services
{
    public interface IOrganizationService
    {
        Task<IEnumerable<OrganizationListItemDto>> GetAllAsync();
        Task<OrganizationDto?> GetByIdAsync(Guid id);
        Task<Guid> CreateAsync(CreateOrganizationDto dto);
        Task UpdateAsync(Guid id, UpdateOrganizationDto dto);
        Task DeleteAsync(Guid id);
    }
}
