using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NetFrontAPI.DTOs;

namespace NetFrontAPI.Services
{
    public interface IGameService
    {
        Task<IEnumerable<GameListItemDto>> GetAllAsync();
        Task<GameDetailDto?> GetByIdAsync(Guid id);
        Task CreateAsync(GameCreateUpdateDto dto);
        Task UpdateAsync(Guid id, GameCreateUpdateDto dto);
        Task DeleteAsync(Guid id);
    }
}
