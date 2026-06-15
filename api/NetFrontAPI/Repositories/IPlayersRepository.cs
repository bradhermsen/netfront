using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NetFrontAPI.Models;
using NetFrontAPI.DTOs;

namespace NetFrontAPI.Repositories
{
    public interface IPlayersRepository
    {
        Task<IEnumerable<PlayerListItemDto>> GetAllDtosAsync();
        Task<PlayerDto?> GetByIdAsync(Guid id);
        Task<IEnumerable<Player>> GetAllAsync();
        Task<Guid> CreateAsync(CreatePlayerDto dto);
        Task UpdateAsync(Guid id, UpdatePlayerDto dto);
        Task DeleteAsync(Guid id);
    }
}
