using System;

namespace NetFrontAPI.DTOs
{
    public class LevelListItemDto
    {
        public Guid LevelId { get; set; }
        public string? LevelName { get; set; }
        public bool IsActive { get; set; }

        public int TeamCount { get; set; }
    }
}
