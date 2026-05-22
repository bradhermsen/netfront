using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using NetFrontAPI.DTOs;
using NetFrontAPI.Services;

namespace NetFrontAPI.Functions
{
    public class LeagueFunctions
    {
        private readonly ILeagueService _service;

        public LeagueFunctions(ILeagueService service)
        {
            _service = service;
        }

        [Function("GetLeagues")]
        public async Task<HttpResponseData> GetLeagues(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "leagues")] HttpRequestData req)
        {
            var leagues = await _service.GetAllAsync();
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(leagues);
            return response;
        }

        [Function("GetLeagueById")]
        public async Task<HttpResponseData> GetLeagueById(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "leagues/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            var league = await _service.GetByIdAsync(id);
            if (league == null)
                return req.CreateResponse(HttpStatusCode.NotFound);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(league);
            return response;
        }

        [Function("CreateLeague")]
        public async Task<HttpResponseData> CreateLeague(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "leagues")] HttpRequestData req)
        {
            var dto = await req.ReadFromJsonAsync<CreateLeagueDto>();
            if (dto == null)
                return req.CreateResponse(HttpStatusCode.BadRequest);

            var id = await _service.CreateAsync(dto);
            var response = req.CreateResponse(HttpStatusCode.Created);
            await response.WriteAsJsonAsync(new { LeagueId = id });
            return response;
        }

        [Function("UpdateLeague")]
        public async Task<HttpResponseData> UpdateLeague(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", "patch", Route = "leagues/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            var dto = await req.ReadFromJsonAsync<UpdateLeagueDto>();
            if (dto == null)
                return req.CreateResponse(HttpStatusCode.BadRequest);

            await _service.UpdateAsync(id, dto);
            return req.CreateResponse(HttpStatusCode.NoContent);
        }

        [Function("DeleteLeague")]
        public async Task<HttpResponseData> DeleteLeague(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "leagues/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            await _service.DeleteAsync(id);
            return req.CreateResponse(HttpStatusCode.NoContent);
        }
    }
}
