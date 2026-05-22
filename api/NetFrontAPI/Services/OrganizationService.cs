using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NetFrontAPI.DTOs;
using NetFrontAPI.Repositories;

namespace NetFrontAPI.Services
{
    public class OrganizationService : IOrganizationService
    {
        private readonly IOrganizationRepository _repo;

        public OrganizationService(IOrganizationRepository repo)
        {
            _repo = repo;
        }

        public Task<IEnumerable<OrganizationListItemDto>> GetAllAsync()
            => _repo.GetAllAsync();

        public Task<OrganizationDto?> GetByIdAsync(Guid id)
            => _repo.GetByIdAsync(id);

        public Task<Guid> CreateAsync(CreateOrganizationDto dto)
            => _repo.CreateAsync(dto);

        public Task UpdateAsync(Guid id, UpdateOrganizationDto dto)
            => _repo.UpdateAsync(id, dto);

        public Task DeleteAsync(Guid id)
            => _repo.DeleteAsync(id);
    }
}
