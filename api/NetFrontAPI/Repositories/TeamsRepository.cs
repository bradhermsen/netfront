using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using Dapper;
using NetFrontAPI.DTOs;

namespace NetFrontAPI.Repositories
{
    public class TeamsRepository : ITeamsRepository
    {
        private readonly IDbConnection _db;

        public TeamsRepository(IDbConnection db)
        {
            _db = db;
        }

        // =========================================================
        // GET ALL (List View)
        // =========================================================
        public async Task<IEnumerable<TeamsListItemDto>> GetAllAsync()
        {
            var sql = @"
                SELECT 
                    t.Id AS TeamId,
                    t.Name,
                    o.Name AS OrganizationName,
                    l.Name AS LevelName,
                    s.SeasonName,
                    (SELECT COUNT(*) FROM RosterEntries r WHERE r.TeamId = t.Id) AS RosterCount,
                    t.HeadCoachName,
                    t.ScorekeeperCode,
                    t.StatManagerCode,
                    t.IsActive,
                    t.IsExternal
                FROM Teams t
                LEFT JOIN Organizations o ON t.OrganizationId = o.OrganizationId
                LEFT JOIN Levels l ON t.LevelId = l.Id
                LEFT JOIN Seasons s ON t.SeasonId = s.SeasonId
                ORDER BY t.SortOrder, t.Name";

            return await _db.QueryAsync<TeamsListItemDto>(sql);
        }

        // =========================================================
        // GET DETAIL
        // =========================================================
        public async Task<TeamDetailDto?> GetByIdAsync(Guid id)
        {
            var sql = @"
                SELECT 
                    t.Id AS TeamId,
                    t.OrganizationId,
                    o.Name AS OrganizationName,
                    t.LevelId,
                    l.Name AS LevelName,
                    t.SeasonId,
                    s.SeasonName,
                    (SELECT COUNT(*) FROM RosterEntries r WHERE r.TeamId = t.Id) AS RosterCount,
                    t.Name,
                    t.HeadCoachName,
                    t.AssistantCoach1Name,
                    t.AssistantCoach2Name,
                    t.AssistantCoach3Name,
                    t.AssistantCoach4Name,
                    t.ScorekeeperCode,
                    t.StatManagerCode,
                    t.IsActive,
                    t.IsExternal,
                    t.Notes
                FROM Teams t
                LEFT JOIN Organizations o ON t.OrganizationId = o.OrganizationId
                LEFT JOIN Levels l ON t.LevelId = l.Id
                LEFT JOIN Seasons s ON t.SeasonId = s.SeasonId
                WHERE t.Id = @Id;
            ";

            return await _db.QueryFirstOrDefaultAsync<TeamDetailDto>(sql, new { Id = id });
        }

        // =========================================================
        // CREATE
        // =========================================================
        public async Task CreateAsync(TeamCreateUpdateDto dto)
        {
            var sql = @"
                INSERT INTO Teams (
                    Id,
                    OrganizationId,
                    LevelId,
                    SeasonId,
                    Name,
                    HeadCoachName,
                    AssistantCoach1Name,
                    AssistantCoach2Name,
                    AssistantCoach3Name,
                    AssistantCoach4Name,
                    ScorekeeperCode,
                    StatManagerCode,
                    IsActive,
                    IsExternal,
                    Notes
                )
                VALUES (
                    @Id,
                    @OrganizationId,
                    @LevelId,
                    @SeasonId,
                    @Name,
                    @HeadCoachName,
                    @AssistantCoach1Name,
                    @AssistantCoach2Name,
                    @AssistantCoach3Name,
                    @AssistantCoach4Name,
                    @ScorekeeperCode,
                    @StatManagerCode,
                    @IsActive,
                    @IsExternal,
                    @Notes
                )";

            await _db.ExecuteAsync(sql, new
            {
                Id = Guid.NewGuid(),
                dto.OrganizationId,
                dto.LevelId,
                dto.SeasonId,
                dto.Name,
                dto.HeadCoachName,
                dto.AssistantCoach1Name,
                dto.AssistantCoach2Name,
                dto.AssistantCoach3Name,
                dto.AssistantCoach4Name,
                dto.ScorekeeperCode,
                dto.StatManagerCode,
                dto.IsActive,
                dto.IsExternal,
                dto.Notes
            });
        }

        // =========================================================
        // UPDATE
        // =========================================================
        public async Task UpdateAsync(Guid id, TeamCreateUpdateDto dto)
        {
            var sql = @"
                UPDATE Teams
                SET
                    OrganizationId = @OrganizationId,
                    LevelId = @LevelId,
                    SeasonId = @SeasonId,
                    Name = @Name,
                    HeadCoachName = @HeadCoachName,
                    AssistantCoach1Name = @AssistantCoach1Name,
                    AssistantCoach2Name = @AssistantCoach2Name,
                    AssistantCoach3Name = @AssistantCoach3Name,
                    AssistantCoach4Name = @AssistantCoach4Name,
                    ScorekeeperCode = @ScorekeeperCode,
                    StatManagerCode = @StatManagerCode,
                    IsActive = @IsActive,
                    IsExternal = @IsExternal,
                    Notes = @Notes
                WHERE Id = @Id";

            await _db.ExecuteAsync(sql, new
            {
                Id = id,
                dto.OrganizationId,
                dto.LevelId,
                dto.SeasonId,
                dto.Name,
                dto.HeadCoachName,
                dto.AssistantCoach1Name,
                dto.AssistantCoach2Name,
                dto.AssistantCoach3Name,
                dto.AssistantCoach4Name,
                dto.ScorekeeperCode,
                dto.StatManagerCode,
                dto.IsActive,
                dto.IsExternal,
                dto.Notes
            });
        }

        // =========================================================
        // DELETE
        // =========================================================
        public async Task DeleteAsync(Guid id)
        {
            var sql = @"DELETE FROM Teams WHERE Id = @Id";
            await _db.ExecuteAsync(sql, new { Id = id });
        }
    }
}
