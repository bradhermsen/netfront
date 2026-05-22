using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NetFrontAPI.DTOs;

namespace NetFrontAPI.Services
{
    public interface IPlayersService
    {
        Task<IEnumerable<PlayerListItemDto>> GetAllAsync();
        Task<PlayerDto?> GetByIdAsync(Guid id);
        Task<Guid> CreateAsync(CreatePlayerDto dto);
        Task UpdateAsync(Guid id, UpdatePlayerDto dto);
        Task DeleteAsync(Guid id);
    }
}
