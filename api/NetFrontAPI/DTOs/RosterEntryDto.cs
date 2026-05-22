using System;

namespace NetFrontAPI.DTOs
{
    public class RosterEntryDto
    {
        public Guid RosterEntryId { get; set; }
        public Guid TeamId { get; set; }
        public Guid PlayerId { get; set; }

        // Player info
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string FullName { get; set; }

        // Roster info
        public int? JerseyNumber { get; set; }
        public string Position { get; set; }
        public string Shoots { get; set; }
        public string Status { get; set; }
        public int? LineNumber { get; set; }
        public int? Grade { get; set; }
        public string Notes { get; set; }

        // Flags
        public bool IsCaptain { get; set; }
        public bool IsAssistantCaptain { get; set; }
        public bool IsGoalie { get; set; }
        public bool IsActive { get; set; }

        // System
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
