using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NetFrontAPI.Models;
using NetFrontAPI.DTOs;

namespace NetFrontAPI.Repositories
{
    public interface IRosterEntriesRepository
    {
        Task<IEnumerable<RosterEntry>> GetByTeamIdAsync(Guid teamId);
        Task<RosterEntry?> GetByIdAsync(Guid id);
        Task<Guid> CreateAsync(CreateRosterEntryDto dto);
        Task UpdateAsync(Guid id, UpdateRosterEntryDto dto);
        Task DeleteAsync(Guid id);
    }
}
