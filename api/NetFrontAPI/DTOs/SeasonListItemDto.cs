using System;

namespace NetFrontAPI.DTOs
{
    public class SeasonListItemDto
    {
        public Guid SeasonId { get; set; }
        public string SeasonName { get; set; }
        public bool IsActive { get; set; }
        public int TeamCount { get; set; }
    }
}
