using System;

namespace NetFrontAPI.DTOs
{
    public class CreatePlayerDto
    {
        public Guid OrganizationId { get; set; }
        public Guid? TeamId { get; set; }

        public string FirstName { get; set; }
        public string LastName { get; set; }

        public string Gender { get; set; }
        public string Position { get; set; }
        public int? JerseyNumber { get; set; }
        public int? Grade { get; set; }

        public bool IsActive { get; set; }
    }
}
