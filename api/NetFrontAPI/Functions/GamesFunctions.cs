using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using NetFrontAPI.DTOs;
using NetFrontAPI.Services;
using NetFrontAPI.Infrastructure.Authorization;

namespace NetFrontAPI.Functions
{
    public class GamesFunctions
    {
        private readonly IGameService _service;
        private readonly IAuthorizationService _authorizationService;
        private readonly ITeamAuthorizationService _teamAuthorizationService;
        private readonly ICoachTeamsService _coachTeamsService;
        private readonly IAccessCodeValidator _accessCodeValidator;

        public GamesFunctions(
            IGameService service,
            IAuthorizationService authorizationService,
            ITeamAuthorizationService teamAuthorizationService,
            ICoachTeamsService coachTeamsService,
            IAccessCodeValidator accessCodeValidator)
        {
            _service = service;
            _authorizationService = authorizationService;
            _teamAuthorizationService = teamAuthorizationService;
            _coachTeamsService = coachTeamsService;
            _accessCodeValidator = accessCodeValidator;
        }

        [Function("GetGames")]
        public async Task<HttpResponseData> GetGames(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "games")] HttpRequestData req)
        {
            // Validate authorization
            var token = AuthorizationHelper.ExtractBearerToken(req);
            if (string.IsNullOrEmpty(token))
                return await AuthorizationHelper.UnauthorizedResponse(req, "No authorization token provided");

            var (isValid, userId, role) = _authorizationService.ValidateToken(token);
            if (!isValid)
                return await AuthorizationHelper.UnauthorizedResponse(req, "Invalid or expired token");

            // SuperAdmin and OrgAdmin can view all games; other roles can view their team's games
            if (!_authorizationService.HasAnyRole(role, "SuperAdmin", "OrgAdmin", "TeamManager", "Coach", "Viewer"))
                return await AuthorizationHelper.ForbiddenResponse(req, "Insufficient permissions to view games");

            var games = await _service.GetAllAsync();
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(games);
            return response;
        }

        [Function("GetGameById")]
        public async Task<HttpResponseData> GetGameById(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "games/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            // Validate authorization
            var token = AuthorizationHelper.ExtractBearerToken(req);
            if (string.IsNullOrEmpty(token))
                return await AuthorizationHelper.UnauthorizedResponse(req, "No authorization token provided");

            var (isValid, userId, role) = _authorizationService.ValidateToken(token);
            if (!isValid)
                return await AuthorizationHelper.UnauthorizedResponse(req, "Invalid or expired token");

            // SuperAdmin bypass - full access
            if (role == "SuperAdmin")
            {
                var game = await _service.GetByIdAsync(id);
                if (game == null)
                    return req.CreateResponse(HttpStatusCode.NotFound);
                var response = req.CreateResponse(HttpStatusCode.OK);
                await response.WriteAsJsonAsync(game);
                return response;
            }

            // Other roles can view games
            if (!_authorizationService.HasAnyRole(role, "OrgAdmin", "TeamManager", "Coach", "Viewer"))
                return await AuthorizationHelper.ForbiddenResponse(req, "Insufficient permissions to view game details");

            var gameData = await _service.GetByIdAsync(id);
            if (gameData == null)
                return req.CreateResponse(HttpStatusCode.NotFound);
            var result = req.CreateResponse(HttpStatusCode.OK);
            await result.WriteAsJsonAsync(gameData);
            return result;
        }

        [Function("CreateGame")]
        public async Task<HttpResponseData> CreateGame(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "games")] HttpRequestData req)
        {
            // Validate authorization
            var token = AuthorizationHelper.ExtractBearerToken(req);
            if (string.IsNullOrEmpty(token))
                return await AuthorizationHelper.UnauthorizedResponse(req, "No authorization token provided");

            var (isValid, userId, role) = _authorizationService.ValidateToken(token);
            if (!isValid)
                return await AuthorizationHelper.UnauthorizedResponse(req, "Invalid or expired token");

            // Only SuperAdmin and OrgAdmin can create games
            if (!_authorizationService.HasAnyRole(role, "SuperAdmin", "OrgAdmin"))
                return await AuthorizationHelper.ForbiddenResponse(req, "Only SuperAdmin or OrgAdmin can create games");

            var dto = await req.ReadFromJsonAsync<GameCreateUpdateDto>();
            await _service.CreateAsync(dto);
            return req.CreateResponse(HttpStatusCode.Created);
        }

        [Function("UpdateGame")]
        public async Task<HttpResponseData> UpdateGame(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "games/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            // Validate authorization
            var token = AuthorizationHelper.ExtractBearerToken(req);
            if (string.IsNullOrEmpty(token))
                return await AuthorizationHelper.UnauthorizedResponse(req, "No authorization token provided");

            var (isValid, userId, role) = _authorizationService.ValidateToken(token);
            if (!isValid)
                return await AuthorizationHelper.UnauthorizedResponse(req, "Invalid or expired token");

            // SuperAdmin/OrgAdmin can update any game; Coach/TeamManager must be assigned to a team
            if (!_authorizationService.HasAnyRole(role, "SuperAdmin", "OrgAdmin"))
            {
                if (!_authorizationService.HasAnyRole(role, "Coach", "TeamManager"))
                    return await AuthorizationHelper.ForbiddenResponse(req, "Insufficient permissions to update games");
            }

            var dto = await req.ReadFromJsonAsync<GameCreateUpdateDto>();
            await _service.UpdateAsync(id, dto);
            return req.CreateResponse(HttpStatusCode.NoContent);
        }

        [Function("DeleteGame")]
        public async Task<HttpResponseData> DeleteGame(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "games/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            // Validate authorization
            var token = AuthorizationHelper.ExtractBearerToken(req);
            if (string.IsNullOrEmpty(token))
                return await AuthorizationHelper.UnauthorizedResponse(req, "No authorization token provided");

            var (isValid, userId, role) = _authorizationService.ValidateToken(token);
            if (!isValid)
                return await AuthorizationHelper.UnauthorizedResponse(req, "Invalid or expired token");

            // Only SuperAdmin and OrgAdmin can delete games
            if (!_authorizationService.HasAnyRole(role, "SuperAdmin", "OrgAdmin"))
                return await AuthorizationHelper.ForbiddenResponse(req, "Only SuperAdmin or OrgAdmin can delete games");

            await _service.DeleteAsync(id);
            return req.CreateResponse(HttpStatusCode.NoContent);
        }
    }
}
