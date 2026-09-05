using System;
using System.Collections.Generic;

namespace NetFrontAPI.DTOs
{
    public class SeasonOrganizationDto
    {
        public Guid OrganizationId { get; set; }
        public string OrganizationName { get; set; } = string.Empty;
        public string? Abbreviation { get; set; }
        public bool DirectoryIsActive { get; set; }
        public string ParticipationType { get; set; } = "NotParticipating";
        public int TeamCount { get; set; }
    }

    public class SaveSeasonOrganizationsRequestDto
    {
        public List<SaveSeasonOrganizationDto> Organizations { get; set; } = new();
    }

    public class SaveSeasonOrganizationDto
    {
        public Guid OrganizationId { get; set; }
        public string ParticipationType { get; set; } = "NotParticipating";
    }
}
