using System;
using System.Text.Json.Serialization;

namespace NetFrontAPI.DTOs
{
    public class TeamCreateUpdateDto
    {
        [JsonPropertyName("organizationId")]
        public Guid? OrganizationId { get; set; }

        [JsonPropertyName("levelId")]
        public Guid? LevelId { get; set; }

        [JsonPropertyName("seasonId")]
        public Guid? SeasonId { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("headCoachName")]
        public string HeadCoachName { get; set; }

        [JsonPropertyName("assistantCoach1Name")]
        public string AssistantCoach1Name { get; set; }

        [JsonPropertyName("assistantCoach2Name")]
        public string AssistantCoach2Name { get; set; }

        [JsonPropertyName("assistantCoach3Name")]
        public string AssistantCoach3Name { get; set; }

        [JsonPropertyName("assistantCoach4Name")]
        public string AssistantCoach4Name { get; set; }

        [JsonPropertyName("isActive")]
        public bool IsActive { get; set; }

        [JsonPropertyName("isExternal")]
        public bool IsExternal { get; set; }

        [JsonPropertyName("notes")]
        public string Notes { get; set; }

        [JsonPropertyName("scorekeeperCode")]
        public string ScorekeeperCode { get; set; }

        [JsonPropertyName("statManagerCode")]
        public string StatManagerCode { get; set; }
    }
}
