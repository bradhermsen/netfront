using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using NetFrontAPI.DTOs;
using NetFrontAPI.Services;

namespace NetFrontAPI.Functions
{
    public class PlayersFunctions
    {
        private readonly IPlayersService _service;

        public PlayersFunctions(IPlayersService service)
        {
            _service = service;
        }

        // =========================================================
        // GET ALL PLAYERS (DTO VERSION)
        // =========================================================
        [Function("GetPlayersDto")]
        public async Task<HttpResponseData> GetPlayersDto(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "players/dto")] HttpRequestData req)
        {
            var players = await _service.GetAllDtosAsync();

            var res = req.CreateResponse(HttpStatusCode.OK);
            await res.WriteAsJsonAsync(players);
            return res;
        }

        // =========================================================
        // GET PLAYER BY ID
        // =========================================================
        [Function("GetPlayerById")]
        public async Task<HttpResponseData> GetPlayerById(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "players/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            var player = await _service.GetByIdAsync(id);

            if (player == null)
            {
                var notFound = req.CreateResponse(HttpStatusCode.NotFound);
                await notFound.WriteStringAsync("Player not found");
                return notFound;
            }

            var res = req.CreateResponse(HttpStatusCode.OK);
            await res.WriteAsJsonAsync(player);
            return res;
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
                await bad.WriteStringAsync("Invalid payload");
                return bad;
            }

            var id = await _service.CreateAsync(dto);

            var res = req.CreateResponse(HttpStatusCode.Created);
            await res.WriteAsJsonAsync(new { id });
            return res;
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
                await bad.WriteStringAsync("Invalid payload");
                return bad;
            }

            try
            {
                await _service.UpdateAsync(id, dto);
                return req.CreateResponse(HttpStatusCode.NoContent);
            }
            catch (Exception ex)
            {
                var error = req.CreateResponse(HttpStatusCode.InternalServerError);
                await error.WriteAsJsonAsync(new { error = ex.Message, innerError = ex.InnerException?.Message });
                return error;
            }
        }

        // =========================================================
        // DELETE PLAYER
        // =========================================================
        [Function("DeletePlayer")]
        public async Task<HttpResponseData> DeletePlayer(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "players/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            await _service.DeleteAsync(id);
            return req.CreateResponse(HttpStatusCode.NoContent);
        }
    }
}
