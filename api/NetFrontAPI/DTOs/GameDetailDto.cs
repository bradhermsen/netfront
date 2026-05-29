using System;

namespace NetFrontAPI.DTOs
{
    public class GameDetailDto
    {
        public Guid GameId { get; set; }

        public Guid HomeTeamId { get; set; }
        public string HomeTeamName { get; set; }

        public Guid AwayTeamId { get; set; }
        public string AwayTeamName { get; set; }

        public DateTime GameDateTime { get; set; }

        public string ArenaName { get; set; }
        public string RinkName { get; set; }

        public int GameTypeId { get; set; }
        public string GameTypeName { get; set; }

        public int? GameRoundId { get; set; }
        public string? GameRoundName { get; set; }

        public string? Notes { get; set; }

        public string Status { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
