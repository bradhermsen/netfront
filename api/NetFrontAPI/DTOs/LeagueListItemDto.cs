using System;

namespace NetFrontAPI.DTOs
{
    public class LeagueListItemDto
    {
        public Guid LeagueId { get; set; }
        public string LeagueName { get; set; }
        public int OrganizationCount { get; set; }
    }
}
