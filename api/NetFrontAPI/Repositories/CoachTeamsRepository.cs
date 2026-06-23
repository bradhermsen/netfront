using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Dapper;
using NetFrontAPI.DTOs;
using NetFrontAPI.Infrastructure.Database;

namespace NetFrontAPI.Repositories
{
    public class CoachTeamsRepository : ICoachTeamsRepository
    {
        private readonly ISqlConnectionFactory _db;

        public CoachTeamsRepository(ISqlConnectionFactory db)
        {
            _db = db;
        }


        public async Task AssignAsync(Guid userId, Guid teamId)
        {
            using var conn = _db.CreateConnection();

            const string sql = @"
                IF NOT EXISTS (
                    SELECT 1 FROM CoachTeams WHERE UserId = @UserId AND TeamId = @TeamId
                )
                BEGIN
                    INSERT INTO CoachTeams (UserId, TeamId)
                    VALUES (@UserId, @TeamId);
                END";

            await conn.ExecuteAsync(sql, new { UserId = userId, TeamId = teamId });
        }


        public async Task RemoveAsync(Guid userId, Guid teamId)
        {
            using var conn = _db.CreateConnection();

            const string sql = @"
                DELETE FROM CoachTeams
                WHERE UserId = @UserId AND TeamId = @TeamId;";

            await conn.ExecuteAsync(sql, new { UserId = userId, TeamId = teamId });
        }

        public async Task<IEnumerable<CoachTeamDetailDto>> GetTeamsForCoachAsync(Guid userId)
        {
            using var conn = _db.CreateConnection();

            const string sql = @"
                SELECT t.Id AS TeamId, t.Name AS TeamName
                FROM CoachTeams ct
                JOIN Teams t ON t.Id = ct.TeamId
                WHERE ct.UserId = @UserId;";

            return await conn.QueryAsync<CoachTeamDetailDto>(sql, new { UserId = userId });
        }

        public async Task<IEnumerable<CoachTeamDetailDto>> GetCoachesForTeamAsync(Guid teamId)
        {
            using var conn = _db.CreateConnection();

            const string sql = @"
                SELECT u.Id AS UserId, u.FirstName, u.LastName, u.Email
                FROM CoachTeams ct
                JOIN Users u ON u.Id = ct.UserId
                WHERE ct.TeamId = @TeamId;";

            return await conn.QueryAsync<CoachTeamDetailDto>(sql, new { TeamId = teamId });
        }
    }
}
