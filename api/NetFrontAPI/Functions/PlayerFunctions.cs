using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using NetFrontAPI.DTOs;
using NetFrontAPI.Services;

namespace NetFrontAPI.Functions
{
    public class PlayerFunctions
    {
        private readonly IPlayersService _service;

        public PlayerFunctions(IPlayersService service)
        {
            _service = service;
        }

        [Function("GetPlayers")]
        public async Task<HttpResponseData> GetPlayers(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "players")] HttpRequestData req)
        {
            var players = await _service.GetAllAsync();
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(players);
            return response;
        }

        [Function("GetPlayerById")]
        public async Task<HttpResponseData> GetPlayerById(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "players/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            var player = await _service.GetByIdAsync(id);
            if (player == null)
                return req.CreateResponse(HttpStatusCode.NotFound);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(player);
            return response;
        }

        [Function("CreatePlayer")]
        public async Task<HttpResponseData> CreatePlayer(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "players")] HttpRequestData req)
        {
            var dto = await req.ReadFromJsonAsync<CreatePlayerDto>();
            if (dto == null)
                return req.CreateResponse(HttpStatusCode.BadRequest);

            var id = await _service.CreateAsync(dto);
            var response = req.CreateResponse(HttpStatusCode.Created);
            await response.WriteAsJsonAsync(new { PlayerId = id });
            return response;
        }

        [Function("UpdatePlayer")]
        public async Task<HttpResponseData> UpdatePlayer(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", "patch", Route = "players/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            var dto = await req.ReadFromJsonAsync<UpdatePlayerDto>();
            if (dto == null)
                return req.CreateResponse(HttpStatusCode.BadRequest);

            await _service.UpdateAsync(id, dto);
            return req.CreateResponse(HttpStatusCode.NoContent);
        }

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
