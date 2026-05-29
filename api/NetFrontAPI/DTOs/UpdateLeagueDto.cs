using System;

namespace NetFrontAPI.DTOs
{
    public class UpdateLeagueDto
    {
        public string? LeagueName { get; set; }
        public bool IsActive { get; set; }
    }
}
