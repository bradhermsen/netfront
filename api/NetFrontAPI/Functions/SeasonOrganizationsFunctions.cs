using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Dapper;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using NetFrontAPI.DTOs;
using NetFrontAPI.Infrastructure.Authorization;
using NetFrontAPI.Infrastructure.Database;
using NetFrontAPI.Services;

namespace NetFrontAPI.Functions
{
    public class SeasonOrganizationsFunctions
    {
        private static readonly HashSet<string> AllowedParticipationTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "Managed",
            "External",
            "NotParticipating"
        };

        private readonly ISqlConnectionFactory _connectionFactory;
        private readonly IAuthorizationService _authorizationService;

        public SeasonOrganizationsFunctions(
            ISqlConnectionFactory connectionFactory,
            IAuthorizationService authorizationService)
        {
            _connectionFactory = connectionFactory;
            _authorizationService = authorizationService;
        }

        [Function("GetSeasonOrganizations")]
        public async Task<HttpResponseData> GetSeasonOrganizations(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "seasons/{seasonId:guid}/organizations")] HttpRequestData req,
            Guid seasonId)
        {
            var denied = await ValidateAdminAccess(req);
            if (denied != null) return denied;

            using var connection = _connectionFactory.CreateConnection();
            if (!await SeasonExists(connection, seasonId))
                return req.CreateResponse(HttpStatusCode.NotFound);

            const string sql = @"
                SELECT
                    o.OrganizationId,
                    o.Name AS OrganizationName,
                    o.Abbreviation,
                    o.IsActive AS DirectoryIsActive,
                    CASE
                        WHEN LOWER(LTRIM(RTRIM(o.Name))) IN ('external', 'external team') THEN 'External'
                        ELSE COALESCE(so.ParticipationType, 'NotParticipating')
                    END AS ParticipationType,
                    COUNT(t.Id) AS TeamCount
                FROM dbo.Organizations o
                LEFT JOIN dbo.SeasonOrganizations so
                    ON so.OrganizationId = o.OrganizationId
                   AND so.SeasonId = @SeasonId
                LEFT JOIN dbo.Teams t
                    ON t.OrganizationId = o.OrganizationId
                   AND t.SeasonId = @SeasonId
                GROUP BY
                    o.OrganizationId,
                    o.Name,
                    o.Abbreviation,
                    o.IsActive,
                    so.ParticipationType
                ORDER BY o.Name;";

            var organizations = await connection.QueryAsync<SeasonOrganizationDto>(sql, new { SeasonId = seasonId });
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(organizations);
            return response;
        }

        [Function("SaveSeasonOrganizations")]
        public async Task<HttpResponseData> SaveSeasonOrganizations(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "seasons/{seasonId:guid}/organizations")] HttpRequestData req,
            Guid seasonId)
        {
            var denied = await ValidateAdminAccess(req);
            if (denied != null) return denied;

            var body = await req.ReadFromJsonAsync<SaveSeasonOrganizationsRequestDto>();
            if (body?.Organizations == null)
                return await AuthorizationHelper.BadRequestResponse(req, "Organizations are required");

            var duplicateOrganization = body.Organizations
                .GroupBy(item => item.OrganizationId)
                .FirstOrDefault(group => group.Count() > 1);
            if (duplicateOrganization != null)
                return await AuthorizationHelper.BadRequestResponse(req, "Each organization can appear only once");

            if (body.Organizations.Any(item =>
                !AllowedParticipationTypes.Contains(item.ParticipationType?.Trim() ?? string.Empty)))
            {
                return await AuthorizationHelper.BadRequestResponse(
                    req,
                    "Participation type must be Managed, External, or NotParticipating");
            }

            using var connection = _connectionFactory.CreateConnection();
            if (!await SeasonExists(connection, seasonId))
                return req.CreateResponse(HttpStatusCode.NotFound);

            var organizationIds = body.Organizations.Select(item => item.OrganizationId).ToArray();
            var validOrganizations = organizationIds.Length == 0
                ? new List<SeasonOrganizationDirectoryRow>()
                : (await connection.QueryAsync<SeasonOrganizationDirectoryRow>(@"
                    SELECT OrganizationId, Name
                    FROM dbo.Organizations
                    WHERE OrganizationId IN @OrganizationIds;",
                    new { OrganizationIds = organizationIds })).ToList();
            if (validOrganizations.Count != organizationIds.Length)
                return await AuthorizationHelper.BadRequestResponse(req, "One or more organizations do not exist");

            var organizationsById = validOrganizations.ToDictionary(item => item.OrganizationId);

            if (connection.State != ConnectionState.Open) connection.Open();
            using var transaction = connection.BeginTransaction();
            try
            {
                await connection.ExecuteAsync(
                    "DELETE FROM dbo.SeasonOrganizations WHERE SeasonId = @SeasonId;",
                    new { SeasonId = seasonId },
                    transaction);

                const string insertSql = @"
                    INSERT INTO dbo.SeasonOrganizations
                    (
                        SeasonId,
                        OrganizationId,
                        ParticipationType,
                        CreatedAt,
                        UpdatedAt
                    )
                    VALUES
                    (
                        @SeasonId,
                        @OrganizationId,
                        @ParticipationType,
                        SYSUTCDATETIME(),
                        SYSUTCDATETIME()
                    );";

                foreach (var item in body.Organizations)
                {
                    await connection.ExecuteAsync(insertSql, new
                    {
                        SeasonId = seasonId,
                        item.OrganizationId,
                        ParticipationType = IsExternalDirectoryOrganization(organizationsById[item.OrganizationId].Name)
                            ? "External"
                            : NormalizeParticipationType(item.ParticipationType)
                    }, transaction);
                }

                await connection.ExecuteAsync(@"
                    INSERT INTO dbo.SeasonOrganizations
                    (
                        SeasonId,
                        OrganizationId,
                        ParticipationType,
                        CreatedAt,
                        UpdatedAt
                    )
                    SELECT
                        @SeasonId,
                        o.OrganizationId,
                        'External',
                        SYSUTCDATETIME(),
                        SYSUTCDATETIME()
                    FROM dbo.Organizations o
                    WHERE LOWER(LTRIM(RTRIM(o.Name))) IN ('external', 'external team')
                      AND NOT EXISTS
                      (
                          SELECT 1
                          FROM dbo.SeasonOrganizations so
                          WHERE so.SeasonId = @SeasonId
                            AND so.OrganizationId = o.OrganizationId
                      );",
                    new { SeasonId = seasonId },
                    transaction);

                transaction.Commit();
            }
            catch
            {
                transaction.Rollback();
                throw;
            }

            return req.CreateResponse(HttpStatusCode.NoContent);
        }

        private async Task<HttpResponseData?> ValidateAdminAccess(HttpRequestData req)
        {
            var token = AuthorizationHelper.ExtractBearerToken(req);
            if (string.IsNullOrWhiteSpace(token))
                return await AuthorizationHelper.UnauthorizedResponse(req, "Token required");

            var (isValid, _, role) = _authorizationService.ValidateToken(token);
            if (!isValid)
                return await AuthorizationHelper.UnauthorizedResponse(req, "Invalid token");

            return _authorizationService.HasAnyRole(role, "SuperAdmin", "OrgAdmin")
                ? null
                : await AuthorizationHelper.ForbiddenResponse(req, "Insufficient role");
        }

        private static Task<bool> SeasonExists(IDbConnection connection, Guid seasonId)
        {
            return connection.ExecuteScalarAsync<bool>(@"
                SELECT CAST(CASE WHEN EXISTS
                (
                    SELECT 1 FROM dbo.Seasons WHERE SeasonId = @SeasonId
                ) THEN 1 ELSE 0 END AS bit);",
                new { SeasonId = seasonId });
        }

        private static string NormalizeParticipationType(string participationType)
        {
            if (participationType.Equals("Managed", StringComparison.OrdinalIgnoreCase)) return "Managed";
            if (participationType.Equals("External", StringComparison.OrdinalIgnoreCase)) return "External";
            return "NotParticipating";
        }

        private static bool IsExternalDirectoryOrganization(string? organizationName)
        {
            var normalized = organizationName?.Trim();
            return string.Equals(normalized, "External", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(normalized, "External Team", StringComparison.OrdinalIgnoreCase);
        }

        private sealed class SeasonOrganizationDirectoryRow
        {
            public Guid OrganizationId { get; set; }
            public string Name { get; set; } = string.Empty;
        }
    }
}
