using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using Dapper;
using NetFrontAPI.DTOs;
using NetFrontAPI.Models;

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
                    t.OrganizationId,
                    t.LevelId,
                    t.SeasonId,
                    t.Name,
                    t.Abbreviation,
                    o.Name AS OrganizationName,
                    l.Name AS LevelName,
                    s.SeasonName,
                    (SELECT COUNT(*) FROM RosterEntries r WHERE r.TeamId = t.Id) AS RosterCount,
                    t.HeadCoachName,
                    t.ScorekeeperCode,
                    t.StatManagerCode,
                    t.IsActive,
                    t.IsExternal,

                    t.HeadCoachEmail,
                    t.AssistantCoach1Email,
                    t.AssistantCoach2Email,
                    t.AssistantCoach3Email,
                    t.AssistantCoach4Email,

                    t.AssistantCoach1HasLogin,
                    t.AssistantCoach2HasLogin,
                    t.AssistantCoach3HasLogin,
                    t.AssistantCoach4HasLogin

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
                    t.LevelId,
                    t.SeasonId,
                    t.Name,
                    t.Gender,
                    t.Abbreviation,

                    t.HeadCoachName,
                    t.AssistantCoach1Name,
                    t.AssistantCoach2Name,
                    t.AssistantCoach3Name,
                    t.AssistantCoach4Name,

                    t.HeadCoachEmail,
                    t.AssistantCoach1Email,
                    t.AssistantCoach2Email,
                    t.AssistantCoach3Email,
                    t.AssistantCoach4Email,

                    t.AssistantCoach1HasLogin,
                    t.AssistantCoach2HasLogin,
                    t.AssistantCoach3HasLogin,
                    t.AssistantCoach4HasLogin,

                    t.ScorekeeperCode,
                    t.StatManagerCode,
                    t.IsActive,
                    t.IsExternal,
                    t.Notes,

                    (SELECT COUNT(*) FROM RosterEntries r WHERE r.TeamId = t.Id) AS RosterCount

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
        public async Task<Guid> CreateAsync(TeamCreateUpdateDto dto)
        {
            var id = Guid.NewGuid();

            var sql = @"
                INSERT INTO Teams (
                    Id,
                    OrganizationId,
                    LevelId,
                    SeasonId,
                    Name,
                    Gender,
                    Abbreviation,

                    HeadCoachName,
                    AssistantCoach1Name,
                    AssistantCoach2Name,
                    AssistantCoach3Name,
                    AssistantCoach4Name,

                    HeadCoachEmail,
                    AssistantCoach1Email,
                    AssistantCoach2Email,
                    AssistantCoach3Email,
                    AssistantCoach4Email,

                    AssistantCoach1HasLogin,
                    AssistantCoach2HasLogin,
                    AssistantCoach3HasLogin,
                    AssistantCoach4HasLogin,

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
                    @Gender,
                    @Abbreviation,

                    @HeadCoachName,
                    @AssistantCoach1Name,
                    @AssistantCoach2Name,
                    @AssistantCoach3Name,
                    @AssistantCoach4Name,

                    @HeadCoachEmail,
                    @AssistantCoach1Email,
                    @AssistantCoach2Email,
                    @AssistantCoach3Email,
                    @AssistantCoach4Email,

                    @AssistantCoach1HasLogin,
                    @AssistantCoach2HasLogin,
                    @AssistantCoach3HasLogin,
                    @AssistantCoach4HasLogin,

                    @ScorekeeperCode,
                    @StatManagerCode,
                    @IsActive,
                    @IsExternal,
                    @Notes
                )";

            await _db.ExecuteAsync(sql, new
            {
                Id = id,
                dto.OrganizationId,
                dto.LevelId,
                dto.SeasonId,
                dto.Name,
                dto.Gender,
                dto.Abbreviation,

                dto.HeadCoachName,
                dto.AssistantCoach1Name,
                dto.AssistantCoach2Name,
                dto.AssistantCoach3Name,
                dto.AssistantCoach4Name,

                dto.HeadCoachEmail,
                dto.AssistantCoach1Email,
                dto.AssistantCoach2Email,
                dto.AssistantCoach3Email,
                dto.AssistantCoach4Email,

                dto.AssistantCoach1HasLogin,
                dto.AssistantCoach2HasLogin,
                dto.AssistantCoach3HasLogin,
                dto.AssistantCoach4HasLogin,

                dto.ScorekeeperCode,
                dto.StatManagerCode,
                dto.IsActive,
                dto.IsExternal,
                dto.Notes
            });

            return id;
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
                    Gender = @Gender,
                    Abbreviation = @Abbreviation,

                    HeadCoachName = @HeadCoachName,
                    AssistantCoach1Name = @AssistantCoach1Name,
                    AssistantCoach2Name = @AssistantCoach2Name,
                    AssistantCoach3Name = @AssistantCoach3Name,
                    AssistantCoach4Name = @AssistantCoach4Name,

                    HeadCoachEmail = @HeadCoachEmail,
                    AssistantCoach1Email = @AssistantCoach1Email,
                    AssistantCoach2Email = @AssistantCoach2Email,
                    AssistantCoach3Email = @AssistantCoach3Email,
                    AssistantCoach4Email = @AssistantCoach4Email,

                    AssistantCoach1HasLogin = @AssistantCoach1HasLogin,
                    AssistantCoach2HasLogin = @AssistantCoach2HasLogin,
                    AssistantCoach3HasLogin = @AssistantCoach3HasLogin,
                    AssistantCoach4HasLogin = @AssistantCoach4HasLogin,

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
                dto.Gender,
                dto.Abbreviation,

                dto.HeadCoachName,
                dto.AssistantCoach1Name,
                dto.AssistantCoach2Name,
                dto.AssistantCoach3Name,
                dto.AssistantCoach4Name,

                dto.HeadCoachEmail,
                dto.AssistantCoach1Email,
                dto.AssistantCoach2Email,
                dto.AssistantCoach3Email,
                dto.AssistantCoach4Email,

                dto.AssistantCoach1HasLogin,
                dto.AssistantCoach2HasLogin,
                dto.AssistantCoach3HasLogin,
                dto.AssistantCoach4HasLogin,

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

        // =========================================================
        // GET TEAMS BY ORGANIZATION (FIXED)
        // =========================================================
        public async Task<IEnumerable<Team>> GetTeamsByOrganizationAsync(Guid organizationId)
        {
            var sql = @"
                SELECT 
                    t.*,
                    l.Name AS LevelName
                FROM Teams t
                LEFT JOIN Levels l ON l.Id = t.LevelId
                WHERE t.OrganizationId = @OrganizationId
                ORDER BY t.Name;
            ";

            return await _db.QueryAsync<Team>(sql, new { OrganizationId = organizationId });
        }
    }
}
