using System;

namespace NetFrontAPI.DTOs
{
    public class CreateLevelDto
    {
        public string? LevelName { get; set; }
        public bool IsActive { get; set; }
    }
}
