using System;

namespace NetFrontAPI.DTOs
{
    public class PlayerListItemDto
    {
        public Guid PlayerId { get; set; }
        public string FullName { get; set; }

        public string OrganizationName { get; set; }
        public string TeamName { get; set; }

        public int? JerseyNumber { get; set; }
        public string Position { get; set; }

        public bool IsActive { get; set; }
    }
}
