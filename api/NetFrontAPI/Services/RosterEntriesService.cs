using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NetFrontAPI.DTOs;
using NetFrontAPI.Repositories;

namespace NetFrontAPI.Services
{
    public class RosterEntriesService : IRosterEntriesService
    {
        private readonly IRosterEntriesRepository _repo;
        private readonly IPlayersRepository _playersRepo;
        private readonly ITeamsRepository _teamsRepo;

        public RosterEntriesService(
            IRosterEntriesRepository repo,
            IPlayersRepository playersRepo,
            ITeamsRepository teamsRepo)
        {
            _repo = repo;
            _playersRepo = playersRepo;
            _teamsRepo = teamsRepo;
        }

        // =========================================================
        // GET ROSTER FOR TEAM
        // =========================================================
        public async Task<IEnumerable<RosterEntryDto>> GetByTeamIdAsync(Guid teamId)
        {
            // Validate team exists
            var team = await _teamsRepo.GetByIdAsync(teamId);
            if (team == null)
                throw new Exception("Team not found.");

            return await _repo.GetByTeamIdAsync(teamId);
        }

        // =========================================================
        // GET SINGLE ROSTER ENTRY
        // =========================================================
        public async Task<RosterEntryDto?> GetByIdAsync(Guid id)
        {
            return await _repo.GetByIdAsync(id);
        }

        // =========================================================
        // CREATE ROSTER ENTRY
        // =========================================================
        public async Task<Guid> CreateAsync(CreateRosterEntryDto dto)
        {
            // Validate team exists
            var team = await _teamsRepo.GetByIdAsync(dto.TeamId);
            if (team == null)
                throw new Exception("Team not found.");

            // Validate player exists
            var player = await _playersRepo.GetByIdAsync(dto.PlayerId);
            if (player == null)
                throw new Exception("Player not found.");

            // Optional: prevent duplicate roster entries
            var existingRoster = await _repo.GetByTeamIdAsync(dto.TeamId);
            foreach (var entry in existingRoster)
            {
                if (entry.PlayerId == dto.PlayerId)
                    throw new Exception("Player is already on this roster.");
            }

            return await _repo.CreateAsync(dto);
        }

        // =========================================================
        // UPDATE ROSTER ENTRY
        // =========================================================
        public async Task UpdateAsync(Guid id, UpdateRosterEntryDto dto)
        {
            var existing = await _repo.GetByIdAsync(id);
            if (existing == null)
                throw new Exception("Roster entry not found.");

            await _repo.UpdateAsync(id, dto);
        }

        // =========================================================
        // DELETE ROSTER ENTRY
        // =========================================================
        public async Task DeleteAsync(Guid id)
        {
            var existing = await _repo.GetByIdAsync(id);
            if (existing == null)
                throw new Exception("Roster entry not found.");

            await _repo.DeleteAsync(id);
        }
    }
}
