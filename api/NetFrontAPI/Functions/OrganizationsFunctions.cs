using System;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using NetFrontAPI.DTOs;
using NetFrontAPI.Services;

namespace NetFrontAPI.Functions
{
    public class OrganizationsFunctions
    {
        private readonly IOrganizationService _service;

        private static readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        };

        public OrganizationsFunctions(IOrganizationService service)
        {
            _service = service;
        }

        // GET /api/organizations
        [Function("GetOrganizations")]
        public async Task<HttpResponseData> GetOrganizations(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "organizations")] HttpRequestData req)
        {
            var orgs = await _service.GetAllAsync();

            var res = req.CreateResponse(HttpStatusCode.OK);
            res.Headers.Add("Access-Control-Allow-Origin", "http://localhost:5500");
            res.Headers.Add("Content-Type", "application/json");

            var json = JsonSerializer.Serialize(orgs, _jsonOptions);
            await res.WriteStringAsync(json);

            return res;
        }

        // GET /api/organizations/{id}
        [Function("GetOrganizationById")]
        public async Task<HttpResponseData> GetOrganizationById(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "organizations/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            var org = await _service.GetByIdAsync(id);

            var res = req.CreateResponse();
            res.Headers.Add("Access-Control-Allow-Origin", "http://localhost:5500");

            if (org == null)
            {
                res.StatusCode = HttpStatusCode.NotFound;
                await res.WriteStringAsync("Organization not found");
                return res;
            }

            res.StatusCode = HttpStatusCode.OK;
            res.Headers.Add("Content-Type", "application/json");

            var json = JsonSerializer.Serialize(org, _jsonOptions);
            await res.WriteStringAsync(json);

            return res;
        }

        // POST /api/organizations
        [Function("CreateOrganization")]
        public async Task<HttpResponseData> CreateOrganization(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "organizations")] HttpRequestData req)
        {
            var dto = await JsonSerializer.DeserializeAsync<CreateOrganizationDto>(req.Body, _jsonOptions);

            var res = req.CreateResponse();
            res.Headers.Add("Access-Control-Allow-Origin", "http://localhost:5500");

            if (dto == null || string.IsNullOrWhiteSpace(dto.Name))
            {
                res.StatusCode = HttpStatusCode.BadRequest;
                await res.WriteStringAsync("Invalid organization payload");
                return res;
            }

            await _service.CreateAsync(dto);

            res.StatusCode = HttpStatusCode.Created;
            return res;
        }

        // PUT /api/organizations/{id}
        [Function("UpdateOrganization")]
        public async Task<HttpResponseData> UpdateOrganization(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "organizations/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            var dto = await JsonSerializer.DeserializeAsync<UpdateOrganizationDto>(req.Body, _jsonOptions);

            var res = req.CreateResponse();
            res.Headers.Add("Access-Control-Allow-Origin", "http://localhost:5500");

            if (dto == null)
            {
                res.StatusCode = HttpStatusCode.BadRequest;
                await res.WriteStringAsync("Invalid organization payload");
                return res;
            }

            var existing = await _service.GetByIdAsync(id);
            if (existing == null)
            {
                res.StatusCode = HttpStatusCode.NotFound;
                await res.WriteStringAsync("Organization not found");
                return res;
            }

            await _service.UpdateAsync(id, dto);

            res.StatusCode = HttpStatusCode.NoContent;
            return res;
        }

        // DELETE /api/organizations/{id}
        [Function("DeleteOrganization")]
        public async Task<HttpResponseData> DeleteOrganization(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "organizations/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            var res = req.CreateResponse();
            res.Headers.Add("Access-Control-Allow-Origin", "http://localhost:5500");

            var existing = await _service.GetByIdAsync(id);
            if (existing == null)
            {
                res.StatusCode = HttpStatusCode.NotFound;
                await res.WriteStringAsync("Organization not found");
                return res;
            }

            await _service.DeleteAsync(id);

            res.StatusCode = HttpStatusCode.NoContent;
            return res;
        }

        // OPTIONS /api/organizations/*
        [Function("OrganizationsOptions")]
        public HttpResponseData OrganizationsOptions(
            [HttpTrigger(AuthorizationLevel.Anonymous, "options", Route = "organizations/{*any}")] HttpRequestData req)
        {
            var res = req.CreateResponse(HttpStatusCode.OK);

            res.Headers.Add("Access-Control-Allow-Origin", "http://localhost:5500");
            res.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            res.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization");

            return res;
        }
    }
}
