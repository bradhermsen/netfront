using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using Dapper;
using NetFrontAPI.DTOs;

namespace NetFrontAPI.Repositories
{
    public class GameRepository : IGameRepository
    {
        private readonly IDbConnection _db;

        public GameRepository(IDbConnection db)
        {
            _db = db;
        }

        // =========================================================
        // GET ALL
        // =========================================================
        public async Task<IEnumerable<GameListItemDto>> GetAllAsync()
        {
            var sql = @"
                SELECT 
                    g.GameId,
                    g.HomeTeamId,
                    ht.Name AS HomeTeamName,
                    g.AwayTeamId,
                    at.Name AS AwayTeamName,
                    g.GameDateTime,
                    g.ArenaName,
                    g.RinkName,
                    gt.Name AS GameTypeName,
                    gr.RoundName AS GameRoundName,
                    g.Status
                FROM Games g
                LEFT JOIN Teams ht ON g.HomeTeamId = ht.Id
                LEFT JOIN Teams at ON g.AwayTeamId = at.Id
                LEFT JOIN GameTypes gt ON g.GameTypeId = gt.GameTypeId
                LEFT JOIN GameRounds gr ON g.GameRoundId = gr.GameRoundId
                ORDER BY g.GameDateTime ASC;
            ";

            return await _db.QueryAsync<GameListItemDto>(sql);
        }

        // =========================================================
        // GET DETAIL
        // =========================================================
        public async Task<GameDetailDto?> GetByIdAsync(Guid id)
        {
            var sql = @"
                SELECT 
                    g.GameId,
                    g.HomeTeamId,
                    ht.Name AS HomeTeamName,
                    g.AwayTeamId,
                    at.Name AS AwayTeamName,
                    g.GameDateTime,
                    g.ArenaName,
                    g.RinkName,
                    g.GameTypeId,
                    gt.Name AS GameTypeName,
                    g.GameRoundId,
                    gr.RoundName AS GameRoundName,
                    g.Notes,
                    g.Status,
                    g.CreatedAt,
                    g.UpdatedAt
                FROM Games g
                LEFT JOIN Teams ht ON g.HomeTeamId = ht.Id
                LEFT JOIN Teams at ON g.AwayTeamId = at.Id
                LEFT JOIN GameTypes gt ON g.GameTypeId = gt.GameTypeId
                LEFT JOIN GameRounds gr ON g.GameRoundId = gr.GameRoundId
                WHERE g.GameId = @Id;
            ";

            return await _db.QueryFirstOrDefaultAsync<GameDetailDto>(sql, new { Id = id });
        }

        // =========================================================
        // CREATE
        // =========================================================
        public async Task CreateAsync(GameCreateUpdateDto dto)
        {
            var sql = @"
                INSERT INTO Games (
                    GameId,
                    HomeTeamId,
                    AwayTeamId,
                    GameDateTime,
                    ArenaName,
                    RinkName,
                    GameTypeId,
                    GameRoundId,
                    Notes,
                    Status,
                    CreatedAt,
                    UpdatedAt
                )
                VALUES (
                    @GameId,
                    @HomeTeamId,
                    @AwayTeamId,
                    @GameDateTime,
                    @ArenaName,
                    @RinkName,
                    @GameTypeId,
                    @GameRoundId,
                    @Notes,
                    @Status,
                    @CreatedAt,
                    @UpdatedAt
                );
            ";

            var now = DateTime.UtcNow;

            await _db.ExecuteAsync(sql, new
            {
                GameId = Guid.NewGuid(),
                dto.HomeTeamId,
                dto.AwayTeamId,
                dto.GameDateTime,
                dto.ArenaName,
                dto.RinkName,
                dto.GameTypeId,
                dto.GameRoundId,
                dto.Notes,
                Status = "Scheduled",
                CreatedAt = now,
                UpdatedAt = now
            });
        }

        // =========================================================
        // UPDATE
        // =========================================================
        public async Task UpdateAsync(Guid id, GameCreateUpdateDto dto)
        {
            var sql = @"
                UPDATE Games
                SET
                    HomeTeamId = @HomeTeamId,
                    AwayTeamId = @AwayTeamId,
                    GameDateTime = @GameDateTime,
                    ArenaName = @ArenaName,
                    RinkName = @RinkName,
                    GameTypeId = @GameTypeId,
                    GameRoundId = @GameRoundId,
                    Notes = @Notes,
                    UpdatedAt = @UpdatedAt
                WHERE GameId = @GameId;
            ";

            await _db.ExecuteAsync(sql, new
            {
                GameId = id,
                dto.HomeTeamId,
                dto.AwayTeamId,
                dto.GameDateTime,
                dto.ArenaName,
                dto.RinkName,
                dto.GameTypeId,
                dto.GameRoundId,
                dto.Notes,
                UpdatedAt = DateTime.UtcNow
            });
        }

        // =========================================================
        // DELETE
        // =========================================================
        public async Task DeleteAsync(Guid id)
        {
            var sql = @"DELETE FROM Games WHERE GameId = @Id";
            await _db.ExecuteAsync(sql, new { Id = id });
        }
    }
}
