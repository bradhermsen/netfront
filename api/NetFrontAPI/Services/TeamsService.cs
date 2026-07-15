using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using NetFrontAPI.DTOs;
using NetFrontAPI.Repositories;
using NetFrontAPI.Models;

namespace NetFrontAPI.Services
{
    public class TeamsService : ITeamsService
    {
        private readonly ITeamsRepository _repo;
        private readonly IOrganizationRepository _organizationRepository;

        private static readonly Dictionary<string, string> AllowedTeamTypes =
            new(StringComparer.OrdinalIgnoreCase)
            {
                ["boys"] = "Boys",
                ["girls"] = "Girls",
                ["co-ed"] = "Co-Ed",
                ["coed"] = "Co-Ed",
                ["men"] = "Men",
                ["women"] = "Women"
            };

        public TeamsService(ITeamsRepository repo, IOrganizationRepository organizationRepository)
        {
            _repo = repo;
            _organizationRepository = organizationRepository;
        }

        public Task<IEnumerable<TeamsListItemDto>> GetAllAsync() =>
            _repo.GetAllAsync();

        public Task<TeamDetailDto?> GetByIdAsync(Guid id) =>
            _repo.GetByIdAsync(id);

        public async Task<Guid> CreateAsync(TeamCreateUpdateDto dto)
        {
            await ValidateAndApplyRulesAsync(dto);
            return await _repo.CreateAsync(dto);
        }

        public async Task UpdateAsync(Guid id, TeamCreateUpdateDto dto)
        {
            await ValidateAndApplyRulesAsync(dto);
            await _repo.UpdateAsync(id, dto);
        }

        public Task DeleteAsync(Guid id) =>
            _repo.DeleteAsync(id);

        // NEW
        public Task<IEnumerable<Team>> GetTeamsByOrganizationAsync(Guid organizationId) =>
            _repo.GetTeamsByOrganizationAsync(organizationId);

        private async Task ValidateAndApplyRulesAsync(TeamCreateUpdateDto dto)
        {
            if (dto == null)
            {
                throw new ArgumentException("Team payload is required.");
            }

            if (dto.LevelId == Guid.Empty)
            {
                throw new ArgumentException("Level is required.");
            }

            if (dto.SeasonId == Guid.Empty)
            {
                throw new ArgumentException("Season is required.");
            }

            var teamType = NormalizeTeamType(dto.TeamType);
            if (teamType == null)
            {
                throw new ArgumentException("Team type is required and must be one of: Boys, Girls, Co-Ed, Men, Women.");
            }

            dto.TeamType = teamType;
            dto.TeamMascot = string.IsNullOrWhiteSpace(dto.TeamMascot) ? null : dto.TeamMascot.Trim();

            if (dto.IsExternal)
            {
                return;
            }

            if (!dto.OrganizationId.HasValue || dto.OrganizationId.Value == Guid.Empty)
            {
                throw new ArgumentException("Organization is required for internal teams.");
            }

            if (!string.IsNullOrWhiteSpace(dto.TeamMascot))
            {
                return;
            }

            var org = await _organizationRepository.GetByIdAsync(dto.OrganizationId.Value);
            if (org == null)
            {
                throw new ArgumentException("Selected organization was not found.");
            }

            if (string.IsNullOrWhiteSpace(org.Mascot))
            {
                throw new InvalidOperationException("Organization mascot is required for internal teams when team mascot is not provided.");
            }

            dto.TeamMascot = org.Mascot.Trim();
        }

        private static string? NormalizeTeamType(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            var normalizedKey = value.Trim().ToLowerInvariant();
            return AllowedTeamTypes.TryGetValue(normalizedKey, out var normalizedType)
                ? normalizedType
                : null;
        }
    }
}
