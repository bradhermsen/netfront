using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using Dapper;
using NetFrontAPI.DTOs;
using NetFrontAPI.Models;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace NetFrontAPI.Repositories
{
    public class RosterEntriesRepository : IRosterEntriesRepository
    {
        private readonly string _connectionString;

        public RosterEntriesRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection");
        }

        private IDbConnection Connection => new SqlConnection(_connectionString);

        // =========================================================
        // GET ROSTER FOR TEAM (Dapper JOIN)
        // =========================================================
        public async Task<IEnumerable<RosterEntry>> GetByTeamIdAsync(Guid teamId)
        {
            var sql = @"
                SELECT 
                    -- Roster Entry
                    r.Id,
                    r.TeamId,
                    r.PlayerId,
                    r.JerseyNumber,
                    r.Position,
                    r.Shoots,
                    r.Status,
                    r.LineNumber,
                    r.Grade,
                    r.Notes,
                    r.IsCaptain,
                    r.IsAssistantCaptain,
                    r.IsGoalie,
                    r.IsActive,
                    r.CreatedAt,
                    r.UpdatedAt,

                    -- Player
                    p.PlayerId AS PlayerId,
                    p.FirstName,
                    p.LastName,
                    p.FullName,
                    p.Position AS Position,
                    p.Shoots AS Shoots,
                    p.Grade AS Grade
                FROM RosterEntries r
                INNER JOIN Players p ON p.PlayerId = r.PlayerId
                WHERE r.TeamId = @TeamId
                ORDER BY r.JerseyNumber ASC;
            ";

            using var conn = Connection;

            var lookup = new Dictionary<Guid, RosterEntry>();

            var result = await conn.QueryAsync<RosterEntry, Player, RosterEntry>(
                sql,
                (r, p) =>
                {
                    if (!lookup.TryGetValue(r.Id, out var entry))
                    {
                        entry = r;
                        lookup.Add(entry.Id, entry);
                    }

                    entry.Player = p;
                    return entry;
                },
                new { TeamId = teamId },
                splitOn: "PlayerId"
            );

            return lookup.Values;
        }

        // =========================================================
        // GET SINGLE ROSTER ENTRY
        // =========================================================
        public async Task<RosterEntry?> GetByIdAsync(Guid id)
        {
            var sql = @"
                SELECT 
                    -- Roster Entry
                    r.Id,
                    r.TeamId,
                    r.PlayerId,
                    r.JerseyNumber,
                    r.Position,
                    r.Shoots,
                    r.Status,
                    r.LineNumber,
                    r.Grade,
                    r.Notes,
                    r.IsCaptain,
                    r.IsAssistantCaptain,
                    r.IsGoalie,
                    r.IsActive,
                    r.CreatedAt,
                    r.UpdatedAt,

                    -- Player
                    p.PlayerId AS PlayerId,
                    p.FirstName,
                    p.LastName,
                    p.FullName,
                    p.Position AS PlayerPosition,
                    p.Shoots AS PlayerShoots,
                    p.Grade AS Grade
                FROM RosterEntries r
                INNER JOIN Players p ON p.PlayerId = r.PlayerId
                WHERE r.Id = @Id;
            ";

            using var conn = Connection;

            RosterEntry? entry = null;

            await conn.QueryAsync<RosterEntry, Player, RosterEntry>(
                sql,
                (r, p) =>
                {
                    if (entry == null)
                        entry = r;

                    entry.Player = p;
                    return entry;
                },
                new { Id = id },
                splitOn: "PlayerId"
            );

            return entry;
        }

        // =========================================================
        // CREATE ROSTER ENTRY
        // =========================================================
        public async Task<Guid> CreateAsync(CreateRosterEntryDto dto)
        {
            var id = Guid.NewGuid();

            var sql = @"
                INSERT INTO RosterEntries (
                    Id, TeamId, PlayerId, JerseyNumber, Position, Shoots, Status,
                    LineNumber, Grade, Notes, IsCaptain, IsAssistantCaptain,
                    IsGoalie, IsActive, CreatedAt, UpdatedAt
                )
                VALUES (
                    @Id, @TeamId, @PlayerId, @JerseyNumber, @Position, @Shoots, @Status,
                    @LineNumber, @Grade, @Notes, @IsCaptain, @IsAssistantCaptain,
                    @IsGoalie, @IsActive, @CreatedAt, @UpdatedAt
                );
            ";

            using var conn = Connection;

            await conn.ExecuteAsync(sql, new
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
                dto.IsActive,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            return id;
        }

        // =========================================================
        // UPDATE ROSTER ENTRY
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
                    UpdatedAt = @UpdatedAt
                WHERE Id = @Id;
            ";

            using var conn = Connection;

            await conn.ExecuteAsync(sql, new
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
                dto.IsActive,
                UpdatedAt = DateTime.UtcNow
            });
        }

        // =========================================================
        // DELETE ROSTER ENTRY
        // =========================================================
        public async Task DeleteAsync(Guid id)
        {
            var sql = "DELETE FROM RosterEntries WHERE Id = @Id;";

            using var conn = Connection;

            await conn.ExecuteAsync(sql, new { Id = id });
        }
    }
}
