using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NetFrontAPI.DTOs;

namespace NetFrontAPI.Repositories
{
    public interface IGameRepository
    {
        Task<IEnumerable<GameListItemDto>> GetAllAsync();
        Task<GameDetailDto?> GetByIdAsync(Guid id);
        Task<string?> GetTeamLevelNameAsync(Guid teamId);
        Task CreateAsync(GameCreateUpdateDto dto);
        Task UpdateAsync(Guid id, GameCreateUpdateDto dto);
        Task DeleteAsync(Guid id);
    }
}
