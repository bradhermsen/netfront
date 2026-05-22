using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using NetFrontAPI.DTOs;
using NetFrontAPI.Services;

namespace NetFrontAPI.Functions
{
    public class LevelFunctions
    {
        private readonly ILevelsService _service;

        public LevelFunctions(ILevelsService service)
        {
            _service = service;
        }

        [Function("GetLevels")]
        public async Task<HttpResponseData> GetLevels(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "levels")] HttpRequestData req)
        {
            var levels = await _service.GetAllAsync();
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(levels);
            return response;
        }

        [Function("GetLevelById")]
        public async Task<HttpResponseData> GetLevelById(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "levels/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            var level = await _service.GetByIdAsync(id);
            if (level == null)
                return req.CreateResponse(HttpStatusCode.NotFound);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(level);
            return response;
        }

        [Function("CreateLevel")]
        public async Task<HttpResponseData> CreateLevel(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "levels")] HttpRequestData req)
        {
            var dto = await req.ReadFromJsonAsync<CreateLevelDto>();
            if (dto == null)
                return req.CreateResponse(HttpStatusCode.BadRequest);

            var id = await _service.CreateAsync(dto);
            var response = req.CreateResponse(HttpStatusCode.Created);
            await response.WriteAsJsonAsync(new { LevelId = id });
            return response;
        }

        [Function("UpdateLevel")]
        public async Task<HttpResponseData> UpdateLevel(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", "patch", Route = "levels/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            var dto = await req.ReadFromJsonAsync<UpdateLevelDto>();
            if (dto == null)
                return req.CreateResponse(HttpStatusCode.BadRequest);

            await _service.UpdateAsync(id, dto);
            return req.CreateResponse(HttpStatusCode.NoContent);
        }

        [Function("DeleteLevel")]
        public async Task<HttpResponseData> DeleteLevel(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "levels/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            await _service.DeleteAsync(id);
            return req.CreateResponse(HttpStatusCode.NoContent);
        }
    }
}
