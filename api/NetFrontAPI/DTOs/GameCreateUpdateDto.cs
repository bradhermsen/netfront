using System;

namespace NetFrontAPI.DTOs
{
    public class GameCreateUpdateDto
    {
        public Guid HomeTeamId { get; set; }
        public Guid AwayTeamId { get; set; }

        public DateTime GameDateTime { get; set; }

        public string ArenaName { get; set; }
        public string RinkName { get; set; }

        public int GameTypeId { get; set; }
        public int? GameRoundId { get; set; }

        public string? Notes { get; set; }
    }
}
