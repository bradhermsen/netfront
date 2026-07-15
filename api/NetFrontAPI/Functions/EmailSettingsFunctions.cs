using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using NetFrontAPI.Infrastructure.Authorization;
using NetFrontAPI.Services;

namespace NetFrontAPI.Functions
{
    public class EmailSettingsFunctions
    {
        private readonly IAuthorizationService _authorizationService;
        private readonly IEmailService _emailService;

        public EmailSettingsFunctions(
            IAuthorizationService authorizationService,
            IEmailService emailService)
        {
            _authorizationService = authorizationService;
            _emailService = emailService;
        }

        [Function("GetEmailSettings")]
        public async Task<HttpResponseData> GetEmailSettings(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "email/settings")] HttpRequestData req)
        {
            var denied = await ValidateAdminAccess(req);
            if (denied != null) return denied;

            var settings = await _emailService.GetSettingsAsync(includeSecret: false);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new
            {
                settings.Enabled,
                settings.SmtpHost,
                settings.SmtpPort,
                settings.UseSsl,
                settings.Username,
                hasPassword = settings.HasPassword,
                settings.FromAddress,
                settings.FromName
            });
            return response;
        }

        [Function("UpdateEmailSettings")]
        public async Task<HttpResponseData> UpdateEmailSettings(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "email/settings")] HttpRequestData req)
        {
            var denied = await ValidateAdminAccess(req);
            if (denied != null) return denied;

            var payload = await req.ReadFromJsonAsync<UpdateEmailSettingsRequest>();
            if (payload == null)
            {
                return await AuthorizationHelper.BadRequestResponse(req, "Missing settings payload.");
            }

            var saved = await _emailService.SaveSettingsAsync(new EmailServerSettings
            {
                Enabled = payload.Enabled,
                SmtpHost = payload.SmtpHost ?? "",
                SmtpPort = payload.SmtpPort,
                UseSsl = payload.UseSsl,
                Username = payload.Username,
                Password = payload.Password,
                FromAddress = payload.FromAddress ?? "",
                FromName = payload.FromName ?? "",
            });

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new
            {
                saved.Enabled,
                saved.SmtpHost,
                saved.SmtpPort,
                saved.UseSsl,
                saved.Username,
                hasPassword = saved.HasPassword,
                saved.FromAddress,
                saved.FromName
            });
            return response;
        }

        [Function("SendEmailSettingsTest")]
        public async Task<HttpResponseData> SendEmailSettingsTest(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "email/settings/test")] HttpRequestData req)
        {
            var denied = await ValidateAdminAccess(req);
            if (denied != null) return denied;

            var payload = await req.ReadFromJsonAsync<SendTestEmailRequest>();
            if (payload == null || string.IsNullOrWhiteSpace(payload.To))
            {
                return await AuthorizationHelper.BadRequestResponse(req, "A recipient email is required.");
            }

            try
            {
                await _emailService.SendAsync(new EmailSendRequest
                {
                    To = new List<string> { payload.To.Trim() },
                    Subject = string.IsNullOrWhiteSpace(payload.Subject)
                        ? "NetFront Email Settings Test"
                        : payload.Subject.Trim(),
                    BodyText = string.IsNullOrWhiteSpace(payload.Body)
                        ? "This is a test email from NetFront Admin Settings."
                        : payload.Body.Trim()
                });

                var ok = req.CreateResponse(HttpStatusCode.OK);
                await ok.WriteAsJsonAsync(new { sent = true });
                return ok;
            }
            catch (Exception ex)
            {
                var bad = req.CreateResponse(HttpStatusCode.BadRequest);
                await bad.WriteAsJsonAsync(new { sent = false, error = ex.Message });
                return bad;
            }
        }

        private async Task<HttpResponseData?> ValidateAdminAccess(HttpRequestData req)
        {
            var token = AuthorizationHelper.ExtractBearerToken(req);
            if (string.IsNullOrWhiteSpace(token))
            {
                return await AuthorizationHelper.UnauthorizedResponse(req, "No authorization token provided");
            }

            var (isValid, _, role) = _authorizationService.ValidateToken(token);
            if (!isValid)
            {
                return await AuthorizationHelper.UnauthorizedResponse(req, "Invalid or expired token");
            }

            if (!_authorizationService.HasAnyRole(role, "SuperAdmin", "OrgAdmin"))
            {
                return await AuthorizationHelper.ForbiddenResponse(req, "Insufficient permissions to manage email settings");
            }

            return null;
        }

        private class UpdateEmailSettingsRequest
        {
            public bool Enabled { get; set; }
            public string? SmtpHost { get; set; }
            public int SmtpPort { get; set; }
            public bool UseSsl { get; set; }
            public string? Username { get; set; }
            public string? Password { get; set; }
            public string? FromAddress { get; set; }
            public string? FromName { get; set; }
        }

        private class SendTestEmailRequest
        {
            public string? To { get; set; }
            public string? Subject { get; set; }
            public string? Body { get; set; }
        }
    }
}