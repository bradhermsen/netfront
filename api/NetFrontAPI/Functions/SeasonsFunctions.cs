using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using NetFrontAPI.DTOs;
using NetFrontAPI.Services;

namespace NetFrontAPI.Functions
{
    public class SeasonsFunctions
    {
        private readonly ISeasonsService _service;

        public SeasonsFunctions(ISeasonsService service)
        {
            _service = service;
        }

        [Function("GetSeasons")]
        public async Task<HttpResponseData> GetSeasons(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "seasons")] HttpRequestData req)
        {
            var seasons = await _service.GetAllAsync();
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(seasons);
            return response;
        }

        [Function("GetSeasonById")]
        public async Task<HttpResponseData> GetSeasonById(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "seasons/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            var season = await _service.GetByIdAsync(id);

            if (season == null)
                return req.CreateResponse(HttpStatusCode.NotFound);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(season);
            return response;
        }

        [Function("CreateSeason")]
        public async Task<HttpResponseData> CreateSeason(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "seasons")] HttpRequestData req)
        {
            var dto = await req.ReadFromJsonAsync<CreateSeasonDto>();

            await _service.CreateAsync(dto);

            return req.CreateResponse(HttpStatusCode.Created);
        }

        [Function("UpdateSeason")]
        public async Task<HttpResponseData> UpdateSeason(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "seasons/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            var dto = await req.ReadFromJsonAsync<UpdateSeasonDto>();

            await _service.UpdateAsync(id, dto);

            return req.CreateResponse(HttpStatusCode.NoContent);
        }

        [Function("DeleteSeason")]
        public async Task<HttpResponseData> DeleteSeason(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "seasons/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            await _service.DeleteAsync(id);

            return req.CreateResponse(HttpStatusCode.NoContent);
        }
    }
}
