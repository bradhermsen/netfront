using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NetFrontAPI.DTOs;
using NetFrontAPI.Models;
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
            var team = await _teamsRepo.GetByIdAsync(teamId);
            if (team == null)
                throw new Exception("Team not found.");

            var entries = await _repo.GetByTeamIdAsync(teamId);
            var list = new List<RosterEntryDto>();

            foreach (var r in entries)
                list.Add(MapToDto(r));

            return list;
        }

        // =========================================================
        // GET SINGLE ROSTER ENTRY
        // =========================================================
        public async Task<RosterEntryDto?> GetByIdAsync(Guid id)
        {
            var entry = await _repo.GetByIdAsync(id);
            return entry == null ? null : MapToDto(entry);
        }

        // =========================================================
        // CREATE ROSTER ENTRY
        // =========================================================
        public async Task<Guid> CreateAsync(CreateRosterEntryDto dto)
        {
            var team = await _teamsRepo.GetByIdAsync(dto.TeamId);
            if (team == null)
                throw new Exception("Team not found.");

            var player = await _playersRepo.GetByIdAsync(dto.PlayerId);
            if (player == null)
                throw new Exception("Player not found.");

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

        // =========================================================
        // INTERNAL MAPPING
        // =========================================================
        private RosterEntryDto MapToDto(RosterEntry r)
        {
            var p = r.Player;

            return new RosterEntryDto
            {
                RosterEntryId = r.Id,
                TeamId = r.TeamId,
                PlayerId = r.PlayerId,

                // Player identity
                FirstName = p?.FirstName,
                LastName = p?.LastName,
                FullName = p?.FullName,

                // Attributes (roster overrides player)
                Position = r.Position ?? p?.Position,
                Shoots = r.Shoots ?? p?.Shoots,

                // Grade: roster overrides player graduation year
                Grade = r.Grade ?? p?.GraduationYear,

                // Roster-specific
                JerseyNumber = r.JerseyNumber,
                Status = r.Status,
                LineNumber = r.LineNumber,
                Notes = r.Notes,

                // Flags
                IsCaptain = r.IsCaptain,
                IsAssistantCaptain = r.IsAssistantCaptain,
                IsGoalie = r.IsGoalie,
                IsActive = r.IsActive,

                // System
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt
            };
        }
    }
}
