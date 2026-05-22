using System;
using System.Net;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using NetFrontAPI.DTOs;
using NetFrontAPI.Services;

namespace NetFrontAPI.Functions
{
    public class OrganizationFunctions
    {
        private readonly IOrganizationService _service;

        public OrganizationFunctions(IOrganizationService service)
        {
            _service = service;
        }

        [Function("GetOrganizations")]
        public async Task<HttpResponseData> GetOrganizations(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "organizations")] HttpRequestData req)
        {
            var items = await _service.GetAllAsync();
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(items);
            return response;
        }

        [Function("GetOrganizationById")]
        public async Task<HttpResponseData> GetOrganizationById(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "organizations/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            var org = await _service.GetByIdAsync(id);
            if (org == null)
            {
                var notFound = req.CreateResponse(HttpStatusCode.NotFound);
                return notFound;
            }

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(org);
            return response;
        }

        [Function("CreateOrganization")]
        public async Task<HttpResponseData> CreateOrganization(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "organizations")] HttpRequestData req)
        {
            var dto = await req.ReadFromJsonAsync<CreateOrganizationDto>();
            if (dto == null)
            {
                var bad = req.CreateResponse(HttpStatusCode.BadRequest);
                return bad;
            }

            var id = await _service.CreateAsync(dto);
            var response = req.CreateResponse(HttpStatusCode.Created);
            await response.WriteAsJsonAsync(new { OrganizationId = id });
            return response;
        }

        [Function("UpdateOrganization")]
        public async Task<HttpResponseData> UpdateOrganization(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", "patch", Route = "organizations/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            var dto = await req.ReadFromJsonAsync<UpdateOrganizationDto>();
            if (dto == null)
            {
                var bad = req.CreateResponse(HttpStatusCode.BadRequest);
                return bad;
            }

            await _service.UpdateAsync(id, dto);
            var response = req.CreateResponse(HttpStatusCode.NoContent);
            return response;
        }

        [Function("DeleteOrganization")]
        public async Task<HttpResponseData> DeleteOrganization(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "organizations/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            await _service.DeleteAsync(id);
            var response = req.CreateResponse(HttpStatusCode.NoContent);
            return response;
        }
    }
}
