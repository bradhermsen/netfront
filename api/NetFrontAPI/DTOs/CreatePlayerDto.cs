using System;

namespace NetFrontAPI.DTOs
{
    public class CreatePlayerDto
    {
        public string FirstName { get; set; } = "";
        public string LastName { get; set; } = "";
        public DateTime? BirthDate { get; set; }

        public int? Grade { get; set; }
        public int? HeightInches { get; set; }
        public int? WeightLbs { get; set; }

        public string? Shoots { get; set; }
        public string? Position { get; set; }

        public Guid? TeamId { get; set; }
        public Guid? OrganizationId { get; set; }
        public Guid? LevelId { get; set; }

        public int? JerseyNumber { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
