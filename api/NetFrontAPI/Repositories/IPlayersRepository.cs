using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NetFrontAPI.Models;
using NetFrontAPI.DTOs;

namespace NetFrontAPI.Repositories
{
    public interface IPlayersRepository
    {
        Task<Player?> GetByIdAsync(Guid id);
        Task<IEnumerable<Player>> GetAllAsync();

        // NEW — enriched DTO version
        Task<IEnumerable<PlayerDto>> GetAllDtoAsync();

        Task<Guid> CreateAsync(CreatePlayerDto dto);
        Task UpdateAsync(Guid id, UpdatePlayerDto dto);
        Task DeleteAsync(Guid id);
    }
}
