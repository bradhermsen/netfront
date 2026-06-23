using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NetFrontAPI.DTOs;

namespace NetFrontAPI.Services
{
    public interface ICoachTeamsService
    {
        Task AssignAsync(Guid userId, Guid teamId);
        Task RemoveAsync(Guid userId, Guid teamId);
        Task<IEnumerable<CoachTeamDetailDto>> GetTeamsForCoachAsync(Guid userId);
        Task<IEnumerable<CoachTeamDetailDto>> GetCoachesForTeamAsync(Guid teamId);
    }
}
