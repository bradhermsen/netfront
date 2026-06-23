using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using NetFrontAPI.DTOs;
using NetFrontAPI.Services;

namespace NetFrontAPI.Functions
{
    public class UsersFunctions
    {
        private readonly IUsersService _service;

        public UsersFunctions(IUsersService service)
        {
            _service = service;
        }

        // ============================================================
        // CREATE USER — NOW RETURNS CREATED USER OBJECT
        // ============================================================
        [Function("CreateUser")]
        public async Task<HttpResponseData> CreateUser(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "users")] HttpRequestData req)
        {
            var dto = await req.ReadFromJsonAsync<CreateUserDto>();

            try
            {
                var created = await _service.CreateUserAsync(
                    dto.Email,
                    dto.Password,
                    dto.Role,
                    dto.OrganizationId,
                    dto.FirstName,
                    dto.LastName
                );

                var res = req.CreateResponse(HttpStatusCode.OK);
                await res.WriteAsJsonAsync(created);
                return res;
            }
            catch (Exception ex)
            {
                var bad = req.CreateResponse(HttpStatusCode.BadRequest);
                await bad.WriteStringAsync(ex.Message);
                return bad;
            }
        }

        // ============================================================
        // GET ALL USERS
        // ============================================================
        [Function("GetUsers")]
        public async Task<HttpResponseData> GetUsers(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "users")] HttpRequestData req)
        {
            var users = await _service.GetAllAsync();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(users);
            return response;
        }

        // ============================================================
        // GET USER BY ID
        // ============================================================
        [Function("GetUserById")]
        public async Task<HttpResponseData> GetUserById(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "users/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            var user = await _service.GetByIdAsync(id);

            if (user == null)
                return req.CreateResponse(HttpStatusCode.NotFound);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(user);
            return response;
        }

        // ============================================================
        // UPDATE USER
        // ============================================================
        [Function("UpdateUser")]
        public async Task<HttpResponseData> UpdateUser(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "users/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            var dto = await req.ReadFromJsonAsync<UpdateUserDto>();

            try
            {
                await _service.UpdateUserAsync(
                    id,
                    dto.Email,
                    dto.FirstName,
                    dto.LastName,
                    dto.OrganizationId,
                    dto.Role,
                    dto.IsActive,
                    dto.Password
                );

                var res = req.CreateResponse(HttpStatusCode.OK);
                await res.WriteAsJsonAsync(new { success = true });
                return res;
            }
            catch (Exception ex)
            {
                var bad = req.CreateResponse(HttpStatusCode.BadRequest);
                await bad.WriteStringAsync(ex.Message);
                return bad;
            }
        }

        // ============================================================
        // RESET PASSWORD
        // ============================================================
        [Function("ResetPassword")]
        public async Task<HttpResponseData> ResetPassword(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "users/{id:guid}/password")] HttpRequestData req,
            Guid id)
        {
            var dto = await req.ReadFromJsonAsync<ResetPasswordDto>();

            try
            {
                await _service.ResetPasswordAsync(id, dto.NewPassword);
                return req.CreateResponse(HttpStatusCode.NoContent);
            }
            catch (Exception ex)
            {
                var bad = req.CreateResponse(HttpStatusCode.BadRequest);
                await bad.WriteStringAsync(ex.Message);
                return bad;
            }
        }

        // ============================================================
        // GET USER BY EMAIL (QUERY STRING)
        // ============================================================
        [Function("GetUserByEmail")]
        public async Task<HttpResponseData> GetUserByEmail(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "users/by-email")] HttpRequestData req)
        {
            var query = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
            var email = query["email"];

            if (string.IsNullOrWhiteSpace(email))
            {
                var bad = req.CreateResponse(HttpStatusCode.BadRequest);
                await bad.WriteStringAsync("Email is required");
                return bad;
            }

            var user = await _service.GetByEmailAsync(email);

            if (user == null)
            {
                var notFound = req.CreateResponse(HttpStatusCode.NotFound);
                await notFound.WriteStringAsync("User not found");
                return notFound;
            }

            var ok = req.CreateResponse(HttpStatusCode.OK);
            await ok.WriteAsJsonAsync(user);
            return ok;
        }

        // ============================================================
        // DELETE USER
        // ============================================================
        [Function("DeleteUser")]
        public async Task<HttpResponseData> DeleteUser(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "users/{id:guid}")] HttpRequestData req,
            Guid id)
        {
            try
            {
                await _service.DeleteUserAsync(id);
                return req.CreateResponse(HttpStatusCode.NoContent);
            }
            catch (Exception ex)
            {
                var bad = req.CreateResponse(HttpStatusCode.BadRequest);
                await bad.WriteStringAsync(ex.Message);
                return bad;
            }
        }
    }
}
