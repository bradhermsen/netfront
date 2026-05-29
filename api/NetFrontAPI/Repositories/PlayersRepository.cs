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
        // GET PLAYER BY ID
        // =========================================================
        public async Task<Player?> GetByIdAsync(Guid id)
        {
            var sql = @"
                SELECT 
                    PlayerId,
                    FirstName,
                    LastName,
                    FullName,
                    BirthDate,
                    GraduationYear,
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
                WHERE PlayerId = @Id;
            ";

            using var conn = Connection;
            return await conn.QueryFirstOrDefaultAsync<Player>(sql, new { Id = id });
        }

        // =========================================================
        // GET ALL PLAYERS (RAW MODEL)
        // =========================================================
        public async Task<IEnumerable<Player>> GetAllAsync()
        {
            var sql = @"
                SELECT 
                    PlayerId,
                    FirstName,
                    LastName,
                    FullName,
                    BirthDate,
                    GraduationYear,
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
        // GET ALL PLAYERS (DTO WITH TEAM + ORG NAMES)
        // =========================================================
        public async Task<IEnumerable<PlayerDto>> GetAllDtoAsync()
        {
            var sql = @"
                SELECT 
                    p.PlayerId,
                    p.FirstName,
                    p.LastName,
                    p.FullName,
                    p.OrganizationId,
                    o.Name AS OrganizationName,
                    p.TeamId,
                    t.Name AS TeamName,
                    p.Position,
                    p.Shoots,
                    p.JerseyNumber,
                    p.IsActive
                FROM Players p
                LEFT JOIN Teams t ON p.TeamId = t.Id
                LEFT JOIN Organizations o ON p.OrganizationId = o.OrganizationId
                ORDER BY p.LastName, p.FirstName;
            ";

            using var conn = Connection;
            return await conn.QueryAsync<PlayerDto>(sql);
        }

        // =========================================================
        // CREATE PLAYER
        // =========================================================
        public async Task<Guid> CreateAsync(CreatePlayerDto dto)
        {
            var id = Guid.NewGuid();

            var sql = @"
                INSERT INTO Players (
                    PlayerId,
                    FirstName,
                    LastName,
                    FullName,
                    BirthDate,
                    GraduationYear,
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
                    @PlayerId,
                    @FirstName,
                    @LastName,
                    @FullName,
                    @BirthDate,
                    @GraduationYear,
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
                PlayerId = id,
                dto.FirstName,
                dto.LastName,
                dto.FullName,
                dto.BirthDate,
                dto.GraduationYear,
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
            var sql = @"
                UPDATE Players
                SET
                    FirstName = @FirstName,
                    LastName = @LastName,
                    FullName = @FullName,
                    BirthDate = @BirthDate,
                    GraduationYear = @GraduationYear,
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
                WHERE PlayerId = @PlayerId;
            ";

            using var conn = Connection;

            await conn.ExecuteAsync(sql, new
            {
                PlayerId = id,
                dto.FirstName,
                dto.LastName,
                dto.FullName,
                dto.BirthDate,
                dto.GraduationYear,
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
        }

        // =========================================================
        // DELETE PLAYER
        // =========================================================
        public async Task DeleteAsync(Guid id)
        {
            var sql = "DELETE FROM Players WHERE PlayerId = @Id;";

            using var conn = Connection;
            await conn.ExecuteAsync(sql, new { Id = id });
        }
    }
}
