using System.Collections.Generic;
using System.Threading.Tasks;

namespace NetFrontAPI.Services
{
    public class EmailServerSettings
    {
        public bool Enabled { get; set; }
        public string SmtpHost { get; set; } = "localhost";
        public int SmtpPort { get; set; } = 1025;
        public bool UseSsl { get; set; }
        public string? Username { get; set; }
        public string? Password { get; set; }
        public string FromAddress { get; set; } = "no-reply@netfront.local";
        public string FromName { get; set; } = "NetFront";
        public bool HasPassword => !string.IsNullOrWhiteSpace(Password);
    }

    public class EmailSendRequest
    {
        public List<string> To { get; set; } = new List<string>();
        public string Subject { get; set; } = string.Empty;
        public string BodyText { get; set; } = string.Empty;
        public List<EmailAttachment> Attachments { get; set; } = new List<EmailAttachment>();
    }

    public class EmailAttachment
    {
        public string FileName { get; set; } = "attachment.bin";
        public string ContentType { get; set; } = "application/octet-stream";
        public byte[] Content { get; set; } = System.Array.Empty<byte>();
    }

    public interface IEmailService
    {
        Task<EmailServerSettings> GetSettingsAsync(bool includeSecret = false);
        Task<EmailServerSettings> SaveSettingsAsync(EmailServerSettings settings);
        Task SendAsync(EmailSendRequest request);
    }
}