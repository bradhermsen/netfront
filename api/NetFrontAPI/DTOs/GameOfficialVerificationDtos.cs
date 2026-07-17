using System;
using System.Collections.Generic;

namespace NetFrontAPI.DTOs
{
    public class GameOfficialVerificationDto
    {
        public Guid? OfficialId { get; set; }
        public string Role { get; set; } = string.Empty;
        public string OfficialName { get; set; } = string.Empty;
        public string? OfficialEmail { get; set; }
        public string? SignatureImageBase64 { get; set; }
        public DateTime? SignedAtUtc { get; set; }
    }

    public class GameOfficialsVerificationResponseDto
    {
        public Guid GameId { get; set; }
        public List<GameOfficialVerificationDto> Officials { get; set; } = new();
    }

    public class SaveGameOfficialsVerificationRequestDto
    {
        public List<SaveOfficialSignatureDto> Officials { get; set; } = new();
    }

    public class SaveOfficialSignatureDto
    {
        public string Role { get; set; } = string.Empty;
        public string? SignatureImageBase64 { get; set; }
    }
}