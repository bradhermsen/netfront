using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NetFrontAPI.DTOs;

namespace NetFrontAPI.Repositories
{
    public interface IRosterEntriesRepository
    {
        Task<IEnumerable<RosterEntryDto>> GetByTeamIdAsync(Guid teamId);
        Task<RosterEntryDto?> GetByIdAsync(Guid id);
        Task<Guid> CreateAsync(CreateRosterEntryDto dto);
        Task UpdateAsync(Guid id, UpdateRosterEntryDto dto);
        Task DeleteAsync(Guid id);
    }
}
