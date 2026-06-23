using System;
using System.Text.Json.Serialization;

namespace NetFrontAPI.DTOs
{
    public class AssignCoachDto
    {
        [JsonPropertyName("userId")]
        public Guid UserId { get; set; }

        [JsonPropertyName("teamId")]
        public Guid TeamId { get; set; }
    }
}
