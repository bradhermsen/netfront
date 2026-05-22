using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NetFrontAPI.DTOs;

namespace NetFrontAPI.Services
{
    public interface ISeasonsService
    {
        Task<IEnumerable<SeasonDto>> GetAllAsync();
        Task<SeasonDto?> GetByIdAsync(Guid id);
        Task CreateAsync(CreateSeasonDto dto);
        Task UpdateAsync(Guid id, UpdateSeasonDto dto);
        Task DeleteAsync(Guid id);
    }
}
