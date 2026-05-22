using System;

namespace NetFrontAPI.DTOs
{
    public class SeasonDto
    {
        public Guid SeasonId { get; set; }
        public string SeasonName { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        public bool IsActive { get; set; }
    }
}
