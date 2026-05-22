using System;

namespace NetFrontAPI.DTOs
{
    public class TeamsListItemDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Gender { get; set; }

        public string OrganizationName { get; set; }
        public string LevelName { get; set; }
        public string SeasonName { get; set; }

        public int RosterCount { get; set; }

        public string HeadCoachName { get; set; }
        public string ScorekeeperCode { get; set; }
        public string StatManagerCode { get; set; }

        public bool IsActive { get; set; }
        public bool IsExternal { get; set; }
    }


}
