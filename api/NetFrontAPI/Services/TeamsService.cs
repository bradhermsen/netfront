using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NetFrontAPI.DTOs;
using NetFrontAPI.Repositories;

namespace NetFrontAPI.Services
{
    public class TeamsService : ITeamsService
    {
        private readonly ITeamsRepository _repo;

        public TeamsService(ITeamsRepository repo)
        {
            _repo = repo;
        }

        public Task<IEnumerable<TeamsListItemDto>> GetAllAsync() =>
            _repo.GetAllAsync();

        public Task<TeamDetailDto?> GetByIdAsync(Guid id) =>
            _repo.GetByIdAsync(id);

        public Task CreateAsync(TeamCreateUpdateDto dto) =>
            _repo.CreateAsync(dto);

        public Task UpdateAsync(Guid id, TeamCreateUpdateDto dto) =>
            _repo.UpdateAsync(id, dto);

        public Task DeleteAsync(Guid id) =>
            _repo.DeleteAsync(id);
    }
}