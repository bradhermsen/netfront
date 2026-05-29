using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NetFrontAPI.DTOs;
using NetFrontAPI.Repositories;

namespace NetFrontAPI.Services
{
    public class GameService : IGameService
    {
        private readonly IGameRepository _repo;

        public GameService(IGameRepository repo)
        {
            _repo = repo;
        }

        public Task<IEnumerable<GameListItemDto>> GetAllAsync()
            => _repo.GetAllAsync();

        public Task<GameDetailDto?> GetByIdAsync(Guid id)
            => _repo.GetByIdAsync(id);

        public Task CreateAsync(GameCreateUpdateDto dto)
            => _repo.CreateAsync(dto);

        public Task UpdateAsync(Guid id, GameCreateUpdateDto dto)
            => _repo.UpdateAsync(id, dto);

        public Task DeleteAsync(Guid id)
            => _repo.DeleteAsync(id);
    }
}
