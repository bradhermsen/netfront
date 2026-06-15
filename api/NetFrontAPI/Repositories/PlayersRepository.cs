using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using Dapper;
using NetFrontAPI.Models;
using NetFrontAPI.DTOs;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace NetFrontAPI.Repositories
{
    public class PlayersRepository : IPlayersRepository
    {
        private readonly string _connectionString;

        public PlayersRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection");
        }

        private IDbConnection Connection => new SqlConnection(_connectionString);

        // =========================================================
        // GET PLAYER BY ID (FULL DTO WITH JOINS)
        // =========================================================
        public async Task<PlayerDto?> GetByIdAsync(Guid id)
        {
            const string sql = @"
                SELECT
                    p.PlayerId,
                    p.FirstName,
                    p.LastName,
                    p.FullName,
                    p.BirthDate,
                    p.Grade,
                    p.HeightInches,
                    p.WeightLbs,
                    p.Shoots,
                    p.Position,
                    p.JerseyNumber,
                    p.IsActive,

                    p.TeamId,
                    t.Name AS TeamName,

                    p.OrganizationId,
                    o.Name AS OrganizationName,

                    p.LevelId,
                    l.Name AS LevelName

                FROM Players p
                LEFT JOIN Teams t ON p.TeamId = t.Id
                LEFT JOIN Organizations o ON p.OrganizationId = o.OrganizationId
                LEFT JOIN Levels l ON p.LevelId = l.Id
                WHERE p.PlayerId = @Id;
            ";

            using var conn = Connection;
            return await conn.QueryFirstOrDefaultAsync<PlayerDto>(sql, new { Id = id });
        }

        // =========================================================
        // GET ALL PLAYERS (RAW MODEL)
        // =========================================================
        public async Task<IEnumerable<Player>> GetAllAsync()
        {
            const string sql = @"
                SELECT 
                    PlayerId,
                    FirstName,
                    LastName,
                    FullName,
                    BirthDate,
                    Grade,
                    HeightInches,
                    WeightLbs,
                    Shoots,
                    Position,
                    CreatedAt,
                    UpdatedAt,
                    TeamId,
                    OrganizationId,
                    LevelId,
                    JerseyNumber,
                    IsActive
                FROM Players
                ORDER BY LastName, FirstName;
            ";

            using var conn = Connection;
            return await conn.QueryAsync<Player>(sql);
        }

        // =========================================================
        // GET ALL PLAYERS (DTO WITH TEAM + ORG + LEVEL NAMES + STATUS)
        // =========================================================
        public async Task<IEnumerable<PlayerListItemDto>> GetAllDtosAsync()
        {
            const string sql = @"
                SELECT
                    p.PlayerId AS Id,
                    p.FirstName,
                    p.LastName,
                    p.FullName,
                    p.Grade,
                    p.JerseyNumber,
                    p.Position,
                    p.Shoots,

                    p.TeamId,
                    p.OrganizationId,
                    p.LevelId,

                    t.Name AS TeamName,
                    o.Name AS OrganizationName,
                    l.Name AS LevelName,

                    CASE 
                        WHEN p.IsActive = 1 THEN 'Active'
                        ELSE 'Inactive'
                    END AS Status

                FROM Players p
                LEFT JOIN Teams t ON p.TeamId = t.Id
                LEFT JOIN Organizations o ON p.OrganizationId = o.OrganizationId
                LEFT JOIN Levels l ON p.LevelId = l.Id
                ORDER BY p.LastName, p.FirstName;
            ";

            using var conn = Connection;
            return await conn.QueryAsync<PlayerListItemDto>(sql);
        }

        // =========================================================
        // CREATE PLAYER
        // =========================================================
        public async Task<Guid> CreateAsync(CreatePlayerDto dto)
        {
            var id = Guid.NewGuid();

            const string sql = @"
                INSERT INTO Players (
                    PlayerId,
                    FirstName,
                    LastName,
                    BirthDate,
                    Grade,
                    HeightInches,
                    WeightLbs,
                    Shoots,
                    Position,
                    CreatedAt,
                    UpdatedAt,
                    TeamId,
                    OrganizationId,
                    LevelId,
                    JerseyNumber,
                    IsActive
                )
                VALUES (
                    @Id,
                    @FirstName,
                    @LastName,
                    @BirthDate,
                    @Grade,
                    @HeightInches,
                    @WeightLbs,
                    @Shoots,
                    @Position,
                    @CreatedAt,
                    @UpdatedAt,
                    @TeamId,
                    @OrganizationId,
                    @LevelId,
                    @JerseyNumber,
                    @IsActive
                );
            ";

            using var conn = Connection;

            await conn.ExecuteAsync(sql, new
            {
                Id = id,
                dto.FirstName,
                dto.LastName,
                dto.BirthDate,
                dto.Grade,
                dto.HeightInches,
                dto.WeightLbs,
                dto.Shoots,
                dto.Position,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                dto.TeamId,
                dto.OrganizationId,
                dto.LevelId,
                dto.JerseyNumber,
                dto.IsActive
            });

            return id;
        }

        // =========================================================
        // UPDATE PLAYER
        // =========================================================
        public async Task UpdateAsync(Guid id, UpdatePlayerDto dto)
        {
            const string sql = @"
                UPDATE Players
                SET
                    FirstName = @FirstName,
                    LastName = @LastName,
                    BirthDate = @BirthDate,
                    Grade = @Grade,
                    HeightInches = @HeightInches,
                    WeightLbs = @WeightLbs,
                    Shoots = @Shoots,
                    Position = @Position,
                    UpdatedAt = @UpdatedAt,
                    TeamId = @TeamId,
                    OrganizationId = @OrganizationId,
                    LevelId = @LevelId,
                    JerseyNumber = @JerseyNumber,
                    IsActive = @IsActive
                WHERE PlayerId = @Id;
            ";

            using var conn = Connection;
            var affected = await conn.ExecuteAsync(sql, new
            {
                Id = id,
                dto.FirstName,
                dto.LastName,
                dto.BirthDate,
                dto.Grade,
                dto.HeightInches,
                dto.WeightLbs,
                dto.Shoots,
                dto.Position,
                UpdatedAt = DateTime.UtcNow,
                dto.TeamId,
                dto.OrganizationId,
                dto.LevelId,
                dto.JerseyNumber,
                dto.IsActive
            });

            if (affected == 0)
                throw new Exception($"Player with ID {id} not found.");
        }

        // =========================================================
        // DELETE PLAYER
        // =========================================================
        public async Task DeleteAsync(Guid id)
        {
            const string sql = "DELETE FROM Players WHERE PlayerId = @Id;";
            using var conn = Connection;
            await conn.ExecuteAsync(sql, new { Id = id });
        }
    }
}
