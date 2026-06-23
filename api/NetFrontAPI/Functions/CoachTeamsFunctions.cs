using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using NetFrontAPI.Services;
using NetFrontAPI.DTOs;

namespace NetFrontAPI.Functions
{
    public class CoachTeamsFunctions
    {
        private readonly ICoachTeamsService _service;

        public CoachTeamsFunctions(ICoachTeamsService service)
        {
            _service = service;
        }

        [Function("AssignCoachToTeam")]
        public async Task<HttpResponseData> AssignCoachToTeam(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "coachteams/assign")] HttpRequestData req)
        {
            AssignCoachDto? dto;

            try
            {
                dto = await req.ReadFromJsonAsync<AssignCoachDto>();
            }
            catch
            {
                var bad = req.CreateResponse(HttpStatusCode.BadRequest);
                await bad.WriteStringAsync("Invalid JSON payload");
                return bad;
            }

            if (dto == null || dto.UserId == Guid.Empty || dto.TeamId == Guid.Empty)
            {
                var bad = req.CreateResponse(HttpStatusCode.BadRequest);
                await bad.WriteStringAsync("UserId and TeamId are required");
                return bad;
            }

            await _service.AssignAsync(dto.UserId, dto.TeamId);

            return req.CreateResponse(HttpStatusCode.OK);
        }



        [Function("RemoveCoachFromTeam")]
        public async Task<HttpResponseData> RemoveCoachFromTeam(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "coachteams/remove")] HttpRequestData req)
        {
            var body = await req.ReadFromJsonAsync<dynamic>();
            Guid userId = body.userId;
            Guid teamId = body.teamId;

            await _service.RemoveAsync(userId, teamId);

            return req.CreateResponse(HttpStatusCode.OK);
        }

        [Function("GetTeamsForCoach")]
        public async Task<HttpResponseData> GetTeamsForCoach(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "coachteams/coach/{userId:guid}")] HttpRequestData req,
            Guid userId)
        {
            var result = await _service.GetTeamsForCoachAsync(userId);
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(result);
            return response;
        }

        [Function("GetCoachesForTeam")]
        public async Task<HttpResponseData> GetCoachesForTeam(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "coachteams/team/{teamId:guid}")] HttpRequestData req,
            Guid teamId)
        {
            var result = await _service.GetCoachesForTeamAsync(teamId);
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(result);
            return response;
        }
    }
}
