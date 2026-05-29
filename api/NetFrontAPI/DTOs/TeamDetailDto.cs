using System;

namespace NetFrontAPI.DTOs
{
    public class TeamDetailDto
    {
        public Guid Id { get; set; }
        public Guid OrganizationId { get; set; }
        public Guid LevelId { get; set; }
        public Guid SeasonId { get; set; }

        public string? Name { get; set; }
        public string? Gender { get; set; }
        public string? Abbreviation { get; set; }

        public string? HeadCoachName { get; set; }
        public string? AssistantCoach1Name { get; set; }
        public string? AssistantCoach2Name { get; set; }
        public string? AssistantCoach3Name { get; set; }
        public string? AssistantCoach4Name { get; set; }

        public string? Notes { get; set; }
        public string? ScorekeeperCode { get; set; }
        public string? StatManagerCode { get; set; }

        public bool IsExternal { get; set; }
        public bool IsActive { get; set; }
    }
}
