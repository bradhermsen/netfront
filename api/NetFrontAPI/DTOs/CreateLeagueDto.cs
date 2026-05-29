using System;

namespace NetFrontAPI.DTOs
{
    public class CreateLeagueDto
    {
        public string? LeagueName { get; set; }
        public bool IsActive { get; set; }
    }
}
