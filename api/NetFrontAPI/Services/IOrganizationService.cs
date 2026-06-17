using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NetFrontAPI.DTOs;
using NetFrontAPI.Models;

namespace NetFrontAPI.Services
{
    public interface IOrganizationService
    {
        Task<IEnumerable<OrganizationListItemDto>> GetAllAsync();
        Task<OrganizationDto?> GetByIdAsync(Guid id);

        // Updated: now returns full Organization
        Task<Organization> CreateAsync(CreateOrganizationDto dto);

        // New: auto-create OrgOwner user + auth record
        Task CreateOrgOwnerForOrganizationAsync(Organization org);

        Task UpdateAsync(Guid id, UpdateOrganizationDto dto);
        Task DeleteAsync(Guid id);
    }
}
