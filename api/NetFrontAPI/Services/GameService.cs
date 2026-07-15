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

        public async Task CreateAsync(GameCreateUpdateDto dto)
        {
            dto.PeriodLengthMinutes = await ResolvePeriodLengthMinutesAsync(dto);
            await _repo.CreateAsync(dto);
        }

        public async Task UpdateAsync(Guid id, GameCreateUpdateDto dto)
        {
            dto.PeriodLengthMinutes = await ResolvePeriodLengthMinutesAsync(dto);
            await _repo.UpdateAsync(id, dto);
        }

        public Task DeleteAsync(Guid id)
            => _repo.DeleteAsync(id);

        private async Task<int> ResolvePeriodLengthMinutesAsync(GameCreateUpdateDto dto)
        {
            if (dto.PeriodLengthMinutes.HasValue)
            {
                return dto.PeriodLengthMinutes.Value;
            }

            var levelName = await _repo.GetTeamLevelNameAsync(dto.HomeTeamId);
            return GetDefaultPeriodLengthByLevel(levelName);
        }

        private static int GetDefaultPeriodLengthByLevel(string? levelName)
        {
            if (string.IsNullOrWhiteSpace(levelName)) return 17;

            var normalized = levelName.Trim().ToLowerInvariant();
            if (normalized.Contains("jv")) return 15;
            if (normalized.Contains("varsity")) return 17;

            return 17;
        }
    }
}
