using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using Dapper;
using NetFrontAPI.DTOs;

namespace NetFrontAPI.Repositories
{
    public class RosterEntriesRepository : IRosterEntriesRepository
    {
        private readonly IDbConnection _db;

        public RosterEntriesRepository(IDbConnection db)
        {
            _db = db;
        }

        // =========================================================
        // GET ROSTER BY TEAM
        // =========================================================
        public async Task<IEnumerable<RosterEntryDto>> GetByTeamIdAsync(Guid teamId)
        {
            var sql = @"
                SELECT 
                    re.Id AS RosterEntryId,
                    re.TeamId,
                    re.PlayerId,

                    -- Player info
                    p.FirstName,
                    p.LastName,
                    p.FullName,

                    -- Roster info
                    re.JerseyNumber,
                    re.Position,
                    re.Shoots,
                    re.Status,
                    re.LineNumber,
                    re.Grade,
                    re.Notes,

                    -- Flags
                    re.IsCaptain,
                    re.IsAssistantCaptain,
                    re.IsGoalie,
                    re.IsActive,

                    -- System
                    re.CreatedAt,
                    re.UpdatedAt

                FROM RosterEntries re
                JOIN Players p ON re.PlayerId = p.PlayerId
                WHERE re.TeamId = @TeamId
                ORDER BY 
                    CASE WHEN re.IsGoalie = 1 THEN 0 ELSE 1 END,  -- Goalies first
                    re.JerseyNumber,
                    p.LastName;
            ";

            return await _db.QueryAsync<RosterEntryDto>(sql, new { TeamId = teamId });
        }

        // =========================================================
        // GET BY ID
        // =========================================================
        public async Task<RosterEntryDto?> GetByIdAsync(Guid id)
        {
            var sql = @"
                SELECT 
                    re.Id AS RosterEntryId,
                    re.TeamId,
                    re.PlayerId,

                    p.FirstName,
                    p.LastName,
                    p.FullName,

                    re.JerseyNumber,
                    re.Position,
                    re.Shoots,
                    re.Status,
                    re.LineNumber,
                    re.Grade,
                    re.Notes,

                    re.IsCaptain,
                    re.IsAssistantCaptain,
                    re.IsGoalie,
                    re.IsActive,

                    re.CreatedAt,
                    re.UpdatedAt

                FROM RosterEntries re
                JOIN Players p ON re.PlayerId = p.PlayerId
                WHERE re.Id = @Id;
            ";

            return await _db.QueryFirstOrDefaultAsync<RosterEntryDto>(sql, new { Id = id });
        }

        // =========================================================
        // CREATE
        // =========================================================
        public async Task<Guid> CreateAsync(CreateRosterEntryDto dto)
        {
            var id = Guid.NewGuid();

            var sql = @"
                INSERT INTO RosterEntries (
                    Id,
                    TeamId,
                    PlayerId,
                    JerseyNumber,
                    Position,
                    Shoots,
                    Status,
                    LineNumber,
                    Grade,
                    Notes,
                    IsCaptain,
                    IsAssistantCaptain,
                    IsGoalie,
                    IsActive
                )
                VALUES (
                    @Id,
                    @TeamId,
                    @PlayerId,
                    @JerseyNumber,
                    @Position,
                    @Shoots,
                    @Status,
                    @LineNumber,
                    @Grade,
                    @Notes,
                    @IsCaptain,
                    @IsAssistantCaptain,
                    @IsGoalie,
                    @IsActive
                );
            ";

            await _db.ExecuteAsync(sql, new
            {
                Id = id,
                dto.TeamId,
                dto.PlayerId,
                dto.JerseyNumber,
                dto.Position,
                dto.Shoots,
                dto.Status,
                dto.LineNumber,
                dto.Grade,
                dto.Notes,
                dto.IsCaptain,
                dto.IsAssistantCaptain,
                dto.IsGoalie,
                dto.IsActive
            });

            return id;
        }

        // =========================================================
        // UPDATE
        // =========================================================
        public async Task UpdateAsync(Guid id, UpdateRosterEntryDto dto)
        {
            var sql = @"
                UPDATE RosterEntries
                SET
                    JerseyNumber = @JerseyNumber,
                    Position = @Position,
                    Shoots = @Shoots,
                    Status = @Status,
                    LineNumber = @LineNumber,
                    Grade = @Grade,
                    Notes = @Notes,
                    IsCaptain = @IsCaptain,
                    IsAssistantCaptain = @IsAssistantCaptain,
                    IsGoalie = @IsGoalie,
                    IsActive = @IsActive,
                    UpdatedAt = SYSUTCDATETIME()
                WHERE Id = @Id;
            ";

            await _db.ExecuteAsync(sql, new
            {
                Id = id,
                dto.JerseyNumber,
                dto.Position,
                dto.Shoots,
                dto.Status,
                dto.LineNumber,
                dto.Grade,
                dto.Notes,
                dto.IsCaptain,
                dto.IsAssistantCaptain,
                dto.IsGoalie,
                dto.IsActive
            });
        }

        // =========================================================
        // DELETE
        // =========================================================
        public async Task DeleteAsync(Guid id)
        {
            var sql = @"DELETE FROM RosterEntries WHERE Id = @Id;";
            await _db.ExecuteAsync(sql, new { Id = id });
        }
    }
}
