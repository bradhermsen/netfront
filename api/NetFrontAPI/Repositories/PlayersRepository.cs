using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using Dapper;
using NetFrontAPI.DTOs;

namespace NetFrontAPI.Repositories
{
    public class PlayersRepository : IPlayersRepository
    {
        private readonly IDbConnection _db;

        public PlayersRepository(IDbConnection db)
        {
            _db = db;
        }

        public async Task<IEnumerable<PlayerListItemDto>> GetAllAsync()
        {
            var sql = @"
                SELECT 
                    p.PlayerId,
                    p.FirstName + ' ' + p.LastName AS FullName,
                    o.Name AS OrganizationName,
                    t.Name AS TeamName,
                    p.JerseyNumber,
                    p.Position,
                    p.IsActive
                FROM Players p
                JOIN Organizations o ON p.OrganizationId = o.OrganizationId
                LEFT JOIN Teams t ON p.TeamId = t.Id
                ORDER BY p.LastName, p.FirstName;
            ";

            return await _db.QueryAsync<PlayerListItemDto>(sql);
        }

        public async Task<PlayerDto?> GetByIdAsync(Guid id)
        {
            var sql = @"
                SELECT 
                    PlayerId,
                    OrganizationId,
                    TeamId,
                    FirstName,
                    LastName,
                    Gender,
                    Position,
                    JerseyNumber,
                    Grade,
                    IsActive
                FROM Players
                WHERE PlayerId = @Id;
            ";

            return await _db.QueryFirstOrDefaultAsync<PlayerDto>(sql, new { Id = id });
        }

        public async Task<Guid> CreateAsync(CreatePlayerDto dto)
        {
            var id = Guid.NewGuid();

            var sql = @"
                INSERT INTO Players (
                    PlayerId,
                    OrganizationId,
                    TeamId,
                    FirstName,
                    LastName,
                    Gender,
                    Position,
                    JerseyNumber,
                    Grade,
                    IsActive
                )
                VALUES (
                    @PlayerId,
                    @OrganizationId,
                    @TeamId,
                    @FirstName,
                    @LastName,
                    @Gender,
                    @Position,
                    @JerseyNumber,
                    @Grade,
                    @IsActive
                );
            ";

            await _db.ExecuteAsync(sql, new
            {
                PlayerId = id,
                dto.OrganizationId,
                dto.TeamId,
                dto.FirstName,
                dto.LastName,
                dto.Gender,
                dto.Position,
                dto.JerseyNumber,
                dto.Grade,
                dto.IsActive
            });

            return id;
        }

        public async Task UpdateAsync(Guid id, UpdatePlayerDto dto)
        {
            var sql = @"
                UPDATE Players
                SET
                    OrganizationId = @OrganizationId,
                    TeamId = @TeamId,
                    FirstName = @FirstName,
                    LastName = @LastName,
                    Gender = @Gender,
                    Position = @Position,
                    JerseyNumber = @JerseyNumber,
                    Grade = @Grade,
                    IsActive = @IsActive
                WHERE PlayerId = @PlayerId;
            ";

            await _db.ExecuteAsync(sql, new
            {
                PlayerId = id,
                dto.OrganizationId,
                dto.TeamId,
                dto.FirstName,
                dto.LastName,
                dto.Gender,
                dto.Position,
                dto.JerseyNumber,
                dto.Grade,
                dto.IsActive
            });
        }

        public async Task DeleteAsync(Guid id)
        {
            var sql = @"DELETE FROM Players WHERE PlayerId = @Id;";
            await _db.ExecuteAsync(sql, new { Id = id });
        }
    }
}
