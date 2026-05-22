using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NetFrontAPI.DTOs;
using NetFrontAPI.Repositories;

namespace NetFrontAPI.Services
{
    public class PlayersService : IPlayersService
    {
        private readonly IPlayersRepository _repository;

        public PlayersService(IPlayersRepository repository)
        {
            _repository = repository;
        }

        public Task<IEnumerable<PlayerListItemDto>> GetAllAsync()
            => _repository.GetAllAsync();

        public Task<PlayerDto?> GetByIdAsync(Guid id)
            => _repository.GetByIdAsync(id);

        public Task<Guid> CreateAsync(CreatePlayerDto dto)
            => _repository.CreateAsync(dto);

        public Task UpdateAsync(Guid id, UpdatePlayerDto dto)
            => _repository.UpdateAsync(id, dto);

        public Task DeleteAsync(Guid id)
            => _repository.DeleteAsync(id);
    }
}
