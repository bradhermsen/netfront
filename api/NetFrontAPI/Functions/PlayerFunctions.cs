using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using NetFrontAPI.Services;
using NetFrontAPI.DTOs;

namespace NetFrontAPI.Functions
{
    public class PlayerFunctions
    {
        private readonly IPlayersService _playersService;
        private readonly ILogger<PlayerFunctions> _logger;

        public PlayerFunctions(IPlayersService playersService, ILogger<PlayerFunctions> logger)
        {
            _playersService = playersService;
            _logger = logger;
        }

        // =========================================================
        // GET ALL PLAYERS
        // =========================================================
        [Function("GetPlayers")]
        public async Task<HttpResponseData> GetPlayers(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "players")] HttpRequestData req)
        {
            var players = await _playersService.GetAllAsync();
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(players);
            return response;
        }

        // =========================================================
        // GET PLAYER BY ID
        // =========================================================
        [Function("GetPlayerById")]
        public async Task<HttpResponseData> GetPlayerById(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "players/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            var player = await _playersService.GetByIdAsync(id);
            if (player == null)
            {
                var notFound = req.CreateResponse(HttpStatusCode.NotFound);
                await notFound.WriteStringAsync("Player not found.");
                return notFound;
            }

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(player);
            return response;
        }

        // =========================================================
        // CREATE PLAYER
        // =========================================================
        [Function("CreatePlayer")]
        public async Task<HttpResponseData> CreatePlayer(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "players")] HttpRequestData req)
        {
            var dto = await req.ReadFromJsonAsync<CreatePlayerDto>();
            if (dto == null)
            {
                var bad = req.CreateResponse(HttpStatusCode.BadRequest);
                await bad.WriteStringAsync("Invalid request body.");
                return bad;
            }

            var newId = await _playersService.CreateAsync(dto);

            var response = req.CreateResponse(HttpStatusCode.Created);
            await response.WriteAsJsonAsync(new { PlayerId = newId });
            return response;
        }

        // =========================================================
        // UPDATE PLAYER
        // =========================================================
        [Function("UpdatePlayer")]
        public async Task<HttpResponseData> UpdatePlayer(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "players/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            var dto = await req.ReadFromJsonAsync<UpdatePlayerDto>();
            if (dto == null)
            {
                var bad = req.CreateResponse(HttpStatusCode.BadRequest);
                await bad.WriteStringAsync("Invalid request body.");
                return bad;
            }

            try
            {
                await _playersService.UpdateAsync(id, dto);
            }
            catch (Exception ex)
            {
                var notFound = req.CreateResponse(HttpStatusCode.NotFound);
                await notFound.WriteStringAsync(ex.Message);
                return notFound;
            }

            return req.CreateResponse(HttpStatusCode.NoContent);
        }

        // =========================================================
        // DELETE PLAYER
        // =========================================================
        [Function("DeletePlayer")]
        public async Task<HttpResponseData> DeletePlayer(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "players/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            try
            {
                await _playersService.DeleteAsync(id);
            }
            catch (Exception ex)
            {
                var notFound = req.CreateResponse(HttpStatusCode.NotFound);
                await notFound.WriteStringAsync(ex.Message);
                return notFound;
            }

            return req.CreateResponse(HttpStatusCode.NoContent);
        }
    }
}