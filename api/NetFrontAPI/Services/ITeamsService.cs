using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NetFrontAPI.DTOs;

namespace NetFrontAPI.Services
{
    public interface ITeamsService
    {
        Task<IEnumerable<TeamsListItemDto>> GetAllAsync();
        Task<TeamDetailDto?> GetByIdAsync(Guid id);
        Task CreateAsync(TeamCreateUpdateDto dto);
        Task UpdateAsync(Guid id, TeamCreateUpdateDto dto);
        Task DeleteAsync(Guid id);
    }
}
