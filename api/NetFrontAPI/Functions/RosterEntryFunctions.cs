using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using NetFrontAPI.Services;
using NetFrontAPI.DTOs;
using System.Text.Json;

namespace NetFrontAPI.Functions
{
    public class RosterEntriesFunctions
    {
        private readonly IRosterEntriesService _service;

        public RosterEntriesFunctions(IRosterEntriesService service)
        {
            _service = service;
        }

        // =========================================================
        // GET ROSTER FOR TEAM
        // GET /api/teams/{teamId}/roster
        // =========================================================
        [Function("GetRosterByTeam")]
        public async Task<HttpResponseData> GetRosterByTeam(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "teams/{teamId}/roster")]
            HttpRequestData req,
            Guid teamId)
        {
            var roster = await _service.GetByTeamIdAsync(teamId);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(roster);
            return response;
        }

        // =========================================================
        // GET SINGLE ROSTER ENTRY
        // GET /api/roster/{id}
        // =========================================================
        [Function("GetRosterEntryById")]
        public async Task<HttpResponseData> GetRosterEntryById(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "roster/{id}")]
            HttpRequestData req,
            Guid id)
        {
            var entry = await _service.GetByIdAsync(id);

            if (entry == null)
            {
                var notFound = req.CreateResponse(HttpStatusCode.NotFound);
                await notFound.WriteAsJsonAsync(new { error = "Roster entry not found." });
                return notFound;
            }

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(entry);
            return response;
        }

        // =========================================================
        // CREATE ROSTER ENTRY
        // POST /api/roster
        // =========================================================
        [Function("CreateRosterEntry")]
        public async Task<HttpResponseData> CreateRosterEntry(
            [HttpTrigger(AuthorizationLevel.Function, "post", Route = "roster")]
            HttpRequestData req)
        {
            var dto = await req.ReadFromJsonAsync<CreateRosterEntryDto>();

            var id = await _service.CreateAsync(dto);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new { id });
            return response;
        }

        // =========================================================
        // UPDATE ROSTER ENTRY
        // PUT /api/roster/{id}
        // =========================================================
        [Function("UpdateRosterEntry")]
        public async Task<HttpResponseData> UpdateRosterEntry(
            [HttpTrigger(AuthorizationLevel.Function, "put", Route = "roster/{id}")]
            HttpRequestData req,
            Guid id)
        {
            var dto = await req.ReadFromJsonAsync<UpdateRosterEntryDto>();

            await _service.UpdateAsync(id, dto);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new { success = true });
            return response;
        }

        // =========================================================
        // DELETE ROSTER ENTRY
        // DELETE /api/roster/{id}
        // =========================================================
        [Function("DeleteRosterEntry")]
        public async Task<HttpResponseData> DeleteRosterEntry(
            [HttpTrigger(AuthorizationLevel.Function, "delete", Route = "roster/{id}")]
            HttpRequestData req,
            Guid id)
        {
            await _service.DeleteAsync(id);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new { success = true });
            return response;
        }
    }
}
