using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using NetFrontAPI.DTOs;
using NetFrontAPI.Services;

namespace NetFrontAPI.Functions
{
    public class TeamsFunctions
    {
        private readonly ITeamsService _service;

        public TeamsFunctions(ITeamsService service)
        {
            _service = service;
        }

        [Function("GetTeams")]
        public async Task<HttpResponseData> GetTeams(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "teams")] HttpRequestData req)
        {
            var teams = await _service.GetAllAsync();
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(teams);
            return response;
        }

        [Function("GetTeamById")]
        public async Task<HttpResponseData> GetTeamById(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "teams/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            var team = await _service.GetByIdAsync(id);

            if (team == null)
                return req.CreateResponse(HttpStatusCode.NotFound);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(team);
            return response;
        }

        [Function("CreateTeam")]
        public async Task<HttpResponseData> CreateTeam(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "teams")] HttpRequestData req)
        {
            var dto = await req.ReadFromJsonAsync<TeamCreateUpdateDto>();
            var teamId = await _service.CreateAsync(dto);

            var response = req.CreateResponse(HttpStatusCode.Created);
            await response.WriteAsJsonAsync(new { teamId });
            return response;
        }

        [Function("UpdateTeam")]
        public async Task<HttpResponseData> UpdateTeam(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "teams/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            var dto = await req.ReadFromJsonAsync<TeamCreateUpdateDto>();
            await _service.UpdateAsync(id, dto);
            return req.CreateResponse(HttpStatusCode.NoContent);
        }

        [Function("DeleteTeam")]
        public async Task<HttpResponseData> DeleteTeam(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "teams/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            await _service.DeleteAsync(id);
            return req.CreateResponse(HttpStatusCode.NoContent);
        }

        // NEW: FILTER TEAMS BY ORGANIZATION
        [Function("GetTeamsByOrganization")]
        public async Task<HttpResponseData> GetTeamsByOrganization(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "teams/by-organization/{organizationId}")]
            HttpRequestData req,
            string organizationId)
        {
            var teams = await _service.GetTeamsByOrganizationAsync(Guid.Parse(organizationId));

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(teams);
            return response;
        }
    }
}
