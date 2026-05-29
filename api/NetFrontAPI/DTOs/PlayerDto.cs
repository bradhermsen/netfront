using System;

namespace NetFrontAPI.DTOs
{
    public class PlayerDto
    {
        public Guid PlayerId { get; set; }

        public Guid OrganizationId { get; set; }
        public string? OrganizationName { get; set; }

        public Guid? TeamId { get; set; }
        public string? TeamName { get; set; }

        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? FullName { get; set; }

        public string? Position { get; set; }
        public string? Shoots { get; set; }

        public int? JerseyNumber { get; set; }

        public bool IsActive { get; set; }
    }
}
