using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NetFrontAPI.DTOs;
using NetFrontAPI.Repositories;

namespace NetFrontAPI.Services
{
    public class CoachTeamsService : ICoachTeamsService
    {
        private readonly ICoachTeamsRepository _repo;

        public CoachTeamsService(ICoachTeamsRepository repo)
        {
            _repo = repo;
        }

        public Task AssignAsync(Guid userId, Guid teamId)
            => _repo.AssignAsync(userId, teamId);

        public Task RemoveAsync(Guid userId, Guid teamId)
            => _repo.RemoveAsync(userId, teamId);

        public Task<IEnumerable<CoachTeamDetailDto>> GetTeamsForCoachAsync(Guid userId)
            => _repo.GetTeamsForCoachAsync(userId);

        public Task<IEnumerable<CoachTeamDetailDto>> GetCoachesForTeamAsync(Guid teamId)
            => _repo.GetCoachesForTeamAsync(teamId);
    }
}
