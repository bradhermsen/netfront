using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NetFrontAPI.Models;
using NetFrontAPI.DTOs;

namespace NetFrontAPI.Services
{
    public interface IPlayersService
    {
        Task<IEnumerable<Player>> GetAllAsync();
        Task<Player?> GetByIdAsync(Guid id);

        // NEW
        Task<IEnumerable<PlayerDto>> GetAllDtoAsync();

        Task<Guid> CreateAsync(CreatePlayerDto dto);
        Task UpdateAsync(Guid id, UpdatePlayerDto dto);
        Task DeleteAsync(Guid id);
    }
}
