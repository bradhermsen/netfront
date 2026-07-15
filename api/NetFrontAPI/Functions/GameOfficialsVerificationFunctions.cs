using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Dapper;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using NetFrontAPI.DTOs;
using NetFrontAPI.Infrastructure.Database;

namespace NetFrontAPI.Functions
{
    public class GameOfficialsVerificationFunctions
    {
        private readonly ISqlConnectionFactory _connectionFactory;

        public GameOfficialsVerificationFunctions(ISqlConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        [Function("GetGameOfficialsVerification")]
        public async Task<HttpResponseData> GetGameOfficialsVerification(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "games/{gameId:guid}/officials/verification")] HttpRequestData req,
            Guid gameId)
        {
            using var conn = _connectionFactory.CreateConnection();

            const string gameExistsSql = @"
                SELECT COUNT(1)
                FROM Games
                WHERE GameId = @GameId;
            ";

            var gameExists = await conn.ExecuteScalarAsync<int>(gameExistsSql, new { GameId = gameId }) > 0;
            if (!gameExists)
            {
                return req.CreateResponse(HttpStatusCode.NotFound);
            }

            const string sql = @"
                SELECT
                    go.OfficialId,
                    go.Role,
                    LTRIM(RTRIM(
                        COALESCE(
                            NULLIF(CONCAT(o.FirstName, ' ', o.LastName), ' '),
                            NULLIF(CONCAT(go.FirstName, ' ', go.LastName), ' '),
                            ''
                        )
                    )) AS OfficialName,
                    gov.SignatureImageBase64,
                    gov.SignedAtUtc
                FROM GameOfficials go
                LEFT JOIN Officials o ON o.OfficialId = go.OfficialId
                LEFT JOIN GameOfficialVerifications gov
                    ON gov.GameId = go.GameId
                   AND gov.Role = go.Role
                WHERE go.GameId = @GameId
                ORDER BY
                    CASE go.Role
                        WHEN 'Referee1' THEN 1
                        WHEN 'Referee2' THEN 2
                        WHEN 'Linesman1' THEN 3
                        WHEN 'Linesman2' THEN 4
                        ELSE 99
                    END,
                    go.Role;
            ";

            var officials = (await conn.QueryAsync<GameOfficialVerificationDto>(sql, new { GameId = gameId })).ToList();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new GameOfficialsVerificationResponseDto
            {
                GameId = gameId,
                Officials = officials
            });
            return response;
        }

        [Function("SaveGameOfficialsVerification")]
        public async Task<HttpResponseData> SaveGameOfficialsVerification(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "games/{gameId:guid}/officials/verification")] HttpRequestData req,
            Guid gameId)
        {
            var body = await req.ReadFromJsonAsync<SaveGameOfficialsVerificationRequestDto>();
            if (body?.Officials == null || body.Officials.Count == 0)
            {
                var bad = req.CreateResponse(HttpStatusCode.BadRequest);
                await bad.WriteAsJsonAsync(new { message = "At least one official signature payload is required." });
                return bad;
            }

            var submittedRoles = body.Officials
                .Where(x => !string.IsNullOrWhiteSpace(x.Role))
                .Select(x => x.Role.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

            if (submittedRoles.Length == 0)
            {
                var bad = req.CreateResponse(HttpStatusCode.BadRequest);
                await bad.WriteAsJsonAsync(new { message = "Each official entry must include a role." });
                return bad;
            }

            using var conn = _connectionFactory.CreateConnection();

            const string assignedSql = @"
                SELECT
                    go.OfficialId,
                    go.Role,
                    LTRIM(RTRIM(
                        COALESCE(
                            NULLIF(CONCAT(o.FirstName, ' ', o.LastName), ' '),
                            NULLIF(CONCAT(go.FirstName, ' ', go.LastName), ' '),
                            ''
                        )
                    )) AS OfficialName
                FROM GameOfficials go
                LEFT JOIN Officials o ON o.OfficialId = go.OfficialId
                WHERE go.GameId = @GameId;
            ";

            var assigned = (await conn.QueryAsync<GameOfficialVerificationDto>(assignedSql, new { GameId = gameId })).ToList();
            if (assigned.Count == 0)
            {
                var bad = req.CreateResponse(HttpStatusCode.BadRequest);
                await bad.WriteAsJsonAsync(new { message = "No officials are assigned to this game." });
                return bad;
            }

            var assignedByRole = assigned
                .GroupBy(x => x.Role, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

            foreach (var role in submittedRoles)
            {
                if (!assignedByRole.ContainsKey(role))
                {
                    var bad = req.CreateResponse(HttpStatusCode.BadRequest);
                    await bad.WriteAsJsonAsync(new { message = $"Role '{role}' is not assigned to this game." });
                    return bad;
                }
            }

            using var tx = conn.BeginTransaction();

            const string upsertSql = @"
                MERGE GameOfficialVerifications AS target
                USING (SELECT @GameId AS GameId, @Role AS Role) AS source
                   ON target.GameId = source.GameId
                  AND target.Role = source.Role
                WHEN MATCHED THEN
                    UPDATE SET
                        OfficialId = @OfficialId,
                        OfficialName = @OfficialName,
                        SignatureImageBase64 = @SignatureImageBase64,
                        SignedAtUtc = @SignedAtUtc,
                        UpdatedAtUtc = SYSUTCDATETIME()
                WHEN NOT MATCHED THEN
                    INSERT
                    (
                        GameOfficialVerificationId,
                        GameId,
                        OfficialId,
                        Role,
                        OfficialName,
                        SignatureImageBase64,
                        SignedAtUtc,
                        CreatedAtUtc,
                        UpdatedAtUtc
                    )
                    VALUES
                    (
                        NEWID(),
                        @GameId,
                        @OfficialId,
                        @Role,
                        @OfficialName,
                        @SignatureImageBase64,
                        @SignedAtUtc,
                        SYSUTCDATETIME(),
                        SYSUTCDATETIME()
                    );
            ";

            foreach (var item in body.Officials)
            {
                if (string.IsNullOrWhiteSpace(item.Role))
                {
                    continue;
                }

                var role = item.Role.Trim();
                if (!assignedByRole.TryGetValue(role, out var assignedOfficial))
                {
                    continue;
                }

                var signature = string.IsNullOrWhiteSpace(item.SignatureImageBase64)
                    ? null
                    : item.SignatureImageBase64.Trim();

                await conn.ExecuteAsync(
                    upsertSql,
                    new
                    {
                        GameId = gameId,
                        Role = assignedOfficial.Role,
                        assignedOfficial.OfficialId,
                        OfficialName = string.IsNullOrWhiteSpace(assignedOfficial.OfficialName) ? assignedOfficial.Role : assignedOfficial.OfficialName,
                        SignatureImageBase64 = signature,
                        SignedAtUtc = signature == null ? (DateTime?)null : DateTime.UtcNow
                    },
                    tx);
            }

            tx.Commit();
            return req.CreateResponse(HttpStatusCode.NoContent);
        }
    }
}