using System;

namespace NetFrontAPI.DTOs
{
    public class CoachTeamDetailDto
    {
        public Guid UserId { get; set; }
        public Guid TeamId { get; set; }
        public string? CoachName { get; set; }
        public string? CoachEmail { get; set; }
        public string? TeamName { get; set; }
    }
}
