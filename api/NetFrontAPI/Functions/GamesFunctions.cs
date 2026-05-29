using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using NetFrontAPI.DTOs;
using NetFrontAPI.Services;

namespace NetFrontAPI.Functions
{
    public class GamesFunctions
    {
        private readonly IGameService _service;

        public GamesFunctions(IGameService service)
        {
            _service = service;
        }

        [Function("GetGames")]
        public async Task<HttpResponseData> GetGames(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "games")] HttpRequestData req)
        {
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
            var game = await _service.GetByIdAsync(id);

            if (game == null)
                return req.CreateResponse(HttpStatusCode.NotFound);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(game);
            return response;
        }

        [Function("CreateGame")]
        public async Task<HttpResponseData> CreateGame(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "games")] HttpRequestData req)
        {
            var dto = await req.ReadFromJsonAsync<GameCreateUpdateDto>();
            await _service.CreateAsync(dto);
            return req.CreateResponse(HttpStatusCode.Created);
        }

        [Function("UpdateGame")]
        public async Task<HttpResponseData> UpdateGame(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "games/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            var dto = await req.ReadFromJsonAsync<GameCreateUpdateDto>();
            await _service.UpdateAsync(id, dto);
            return req.CreateResponse(HttpStatusCode.NoContent);
        }

        [Function("DeleteGame")]
        public async Task<HttpResponseData> DeleteGame(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "games/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            await _service.DeleteAsync(id);
            return req.CreateResponse(HttpStatusCode.NoContent);
        }
    }
}
