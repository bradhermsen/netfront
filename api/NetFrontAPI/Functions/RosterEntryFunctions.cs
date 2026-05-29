using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using NetFrontAPI.Services;
using NetFrontAPI.DTOs;

namespace NetFrontAPI.Functions
{
    public class RosterEntryFunctions
    {
        private readonly IRosterEntriesService _service;

        public RosterEntryFunctions(IRosterEntriesService service)
        {
            _service = service;
        }

        // =========================================================
        // GET: /api/teams/{teamId}/roster
        // =========================================================
        [Function("GetRosterByTeam")]
        public async Task<HttpResponseData> GetRosterByTeam(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "teams/{teamId}/roster")]
            HttpRequestData req,
            Guid teamId)
        {
            var response = req.CreateResponse();

            try
            {
                var roster = await _service.GetByTeamIdAsync(teamId);
                await response.WriteAsJsonAsync(roster);
            }
            catch (Exception ex)
            {
                response.StatusCode = System.Net.HttpStatusCode.BadRequest;
                await response.WriteAsJsonAsync(new { error = ex.Message });
            }

            return response;
        }

        // =========================================================
        // GET: /api/roster/{id}
        // =========================================================
        [Function("GetRosterEntryById")]
        public async Task<HttpResponseData> GetRosterEntryById(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "roster/{id}")]
            HttpRequestData req,
            Guid id)
        {
            var response = req.CreateResponse();

            var entry = await _service.GetByIdAsync(id);
            if (entry == null)
            {
                response.StatusCode = System.Net.HttpStatusCode.NotFound;
                await response.WriteAsJsonAsync(new { error = "Roster entry not found." });
                return response;
            }

            await response.WriteAsJsonAsync(entry);
            return response;
        }

        // =========================================================
        // POST: /api/roster
        // =========================================================
        [Function("CreateRosterEntry")]
        public async Task<HttpResponseData> CreateRosterEntry(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "roster")]
            HttpRequestData req)
        {
            var response = req.CreateResponse();

            try
            {
                var dto = await JsonSerializer.DeserializeAsync<CreateRosterEntryDto>(req.Body);

                if (dto == null)
                {
                    response.StatusCode = System.Net.HttpStatusCode.BadRequest;
                    await response.WriteAsJsonAsync(new { error = "Invalid request body." });
                    return response;
                }

                var id = await _service.CreateAsync(dto);
                await response.WriteAsJsonAsync(new { id });
            }
            catch (Exception ex)
            {
                response.StatusCode = System.Net.HttpStatusCode.BadRequest;
                await response.WriteAsJsonAsync(new { error = ex.Message });
            }

            return response;
        }

        // =========================================================
        // PUT: /api/roster/{id}
        // =========================================================
        [Function("UpdateRosterEntry")]
        public async Task<HttpResponseData> UpdateRosterEntry(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "roster/{id}")]
            HttpRequestData req,
            Guid id)
        {
            var response = req.CreateResponse();

            try
            {
                var dto = await JsonSerializer.DeserializeAsync<UpdateRosterEntryDto>(req.Body);

                if (dto == null)
                {
                    response.StatusCode = System.Net.HttpStatusCode.BadRequest;
                    await response.WriteAsJsonAsync(new { error = "Invalid request body." });
                    return response;
                }

                await _service.UpdateAsync(id, dto);
                await response.WriteAsJsonAsync(new { success = true });
            }
            catch (Exception ex)
            {
                response.StatusCode = System.Net.HttpStatusCode.BadRequest;
                await response.WriteAsJsonAsync(new { error = ex.Message });
            }

            return response;
        }

        // =========================================================
        // DELETE: /api/roster/{id}
        // =========================================================
        [Function("DeleteRosterEntry")]
        public async Task<HttpResponseData> DeleteRosterEntry(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "roster/{id}")]
            HttpRequestData req,
            Guid id)
        {
            var response = req.CreateResponse();

            try
            {
                await _service.DeleteAsync(id);
                await response.WriteAsJsonAsync(new { success = true });
            }
            catch (Exception ex)
            {
                response.StatusCode = System.Net.HttpStatusCode.BadRequest;
                await response.WriteAsJsonAsync(new { error = ex.Message });
            }

            return response;
        }
    }
}
