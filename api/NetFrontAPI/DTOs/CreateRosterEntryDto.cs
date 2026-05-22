using System;

namespace NetFrontAPI.DTOs
{
    public class CreateRosterEntryDto
    {
        public Guid TeamId { get; set; }
        public Guid PlayerId { get; set; }

        public int? JerseyNumber { get; set; }
        public string Position { get; set; }
        public string Shoots { get; set; }
        public string Status { get; set; }
        public int? LineNumber { get; set; }
        public int? Grade { get; set; }
        public string Notes { get; set; }

        public bool IsCaptain { get; set; }
        public bool IsAssistantCaptain { get; set; }
        public bool IsGoalie { get; set; }
        public bool IsActive { get; set; }
    }
}
