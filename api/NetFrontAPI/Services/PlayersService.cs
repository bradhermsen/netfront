using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NetFrontAPI.Models;
using NetFrontAPI.DTOs;
using NetFrontAPI.Repositories;

namespace NetFrontAPI.Services
{
    public class PlayersService : IPlayersService
    {
        private readonly IPlayersRepository _repo;

        public PlayersService(IPlayersRepository repo)
        {
            _repo = repo;
        }

        public Task<IEnumerable<Player>> GetAllAsync() => _repo.GetAllAsync();
        public Task<Player?> GetByIdAsync(Guid id) => _repo.GetByIdAsync(id);

        // NEW
        public Task<IEnumerable<PlayerDto>> GetAllDtoAsync() => _repo.GetAllDtoAsync();

        public Task<Guid> CreateAsync(CreatePlayerDto dto) => _repo.CreateAsync(dto);
        public Task UpdateAsync(Guid id, UpdatePlayerDto dto) => _repo.UpdateAsync(id, dto);
        public Task DeleteAsync(Guid id) => _repo.DeleteAsync(id);
    }
}
