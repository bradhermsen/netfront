using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using Dapper;
using NetFrontAPI.DTOs;

namespace NetFrontAPI.Repositories
{
    public class OrganizationRepository : IOrganizationRepository
    {
        private readonly IDbConnection _db;

        public OrganizationRepository(IDbConnection db)
        {
            _db = db;
        }

        // ============================================================
        // GET ALL
        // ============================================================
        public async Task<IEnumerable<OrganizationListItemDto>> GetAllAsync()
        {
            var sql = @"
SELECT 
    o.OrganizationId,
    o.Name,
    o.Abbreviation,
    o.City,
    o.State,
    o.Country,
    o.StreetAddress,
    o.ZipCode,
    o.DistrictConference,
    o.Mascot,
    o.LeagueId,
    l.Name AS LeagueName,
    COUNT(t.Id) AS TeamCount,
    o.PrimaryContactFirstName,
    o.PrimaryContactLastName,
    o.PrimaryContactEmail,
    o.IsActive,
    o.CreatedAt,
    o.UpdatedAt
FROM Organizations o
LEFT JOIN Leagues l ON o.LeagueId = l.Id
LEFT JOIN Teams t ON t.OrganizationId = o.OrganizationId
GROUP BY 
    o.OrganizationId,
    o.Name,
    o.Abbreviation,
    o.City,
    o.State,
    o.Country,
    o.StreetAddress,
    o.ZipCode,
    o.DistrictConference,
    o.Mascot,
    o.LeagueId,
    l.Name,
    o.PrimaryContactFirstName,
    o.PrimaryContactLastName,
    o.PrimaryContactEmail,
    o.IsActive,
    o.CreatedAt,
    o.UpdatedAt
ORDER BY o.Name ASC;
";

            return await _db.QueryAsync<OrganizationListItemDto>(sql);
        }

        // ============================================================
        // GET BY ID
        // ============================================================
        public async Task<OrganizationDto?> GetByIdAsync(Guid id)
        {
            var sql = @"
SELECT 
    o.OrganizationId,
    o.Name,
    o.Abbreviation,
    o.City,
    o.State,
    o.Country,
    o.StreetAddress,
    o.ZipCode,
    o.DistrictConference,
    o.Mascot,
    o.LeagueId,
    o.PrimaryContactFirstName,
    o.PrimaryContactLastName,
    o.PrimaryContactEmail,
    o.BillingStreetAddress,
    o.BillingCity,
    o.BillingState,
    o.BillingZipCode,
    o.BillingContactName,
    o.BillingContactEmail,
    o.IsActive,
    o.CreatedAt,
    o.UpdatedAt
FROM Organizations o
WHERE o.OrganizationId = @Id;
";

            return await _db.QueryFirstOrDefaultAsync<OrganizationDto>(sql, new { Id = id });
        }

        // ============================================================
        // CREATE
        // ============================================================
        public async Task<Guid> CreateAsync(CreateOrganizationDto dto)
        {
            var newId = Guid.NewGuid();

            var sql = @"
INSERT INTO Organizations (
    OrganizationId,
    Name,
    Abbreviation,
    City,
    State,
    Country,
    StreetAddress,
    ZipCode,
    DistrictConference,
    Mascot,
    LeagueId,
    PrimaryContactFirstName,
    PrimaryContactLastName,
    PrimaryContactEmail,
    BillingStreetAddress,
    BillingCity,
    BillingState,
    BillingZipCode,
    BillingContactName,
    BillingContactEmail,
    IsActive,
    CreatedAt,
    UpdatedAt
)
VALUES (
    @OrganizationId,
    @Name,
    @Abbreviation,
    @City,
    @State,
    @Country,
    @StreetAddress,
    @ZipCode,
    @DistrictConference,
    @Mascot,
    @LeagueId,
    @PrimaryContactFirstName,
    @PrimaryContactLastName,
    @PrimaryContactEmail,
    @BillingStreetAddress,
    @BillingCity,
    @BillingState,
    @BillingZipCode,
    @BillingContactName,
    @BillingContactEmail,
    @IsActive,
    GETUTCDATE(),
    GETUTCDATE()
);
";

            await _db.ExecuteAsync(sql, new
            {
                OrganizationId = newId,
                dto.Name,
                dto.Abbreviation,
                dto.City,
                dto.State,
                dto.Country,
                dto.StreetAddress,
                dto.ZipCode,
                dto.DistrictConference,
                dto.Mascot,
                dto.LeagueId,
                dto.PrimaryContactFirstName,
                dto.PrimaryContactLastName,
                dto.PrimaryContactEmail,
                dto.BillingStreetAddress,
                dto.BillingCity,
                dto.BillingState,
                dto.BillingZipCode,
                dto.BillingContactName,
                dto.BillingContactEmail,
                dto.IsActive
            });

            return newId;
        }

        // ============================================================
        // UPDATE
        // ============================================================
        public async Task UpdateAsync(Guid id, UpdateOrganizationDto dto)
        {
            var sql = @"
UPDATE Organizations
SET
    Name = @Name,
    Abbreviation = @Abbreviation,
    City = @City,
    State = @State,
    Country = @Country,
    StreetAddress = @StreetAddress,
    ZipCode = @ZipCode,
    DistrictConference = @DistrictConference,
    Mascot = @Mascot,
    LeagueId = @LeagueId,
    PrimaryContactFirstName = @PrimaryContactFirstName,
    PrimaryContactLastName = @PrimaryContactLastName,
    PrimaryContactEmail = @PrimaryContactEmail,
    BillingStreetAddress = @BillingStreetAddress,
    BillingCity = @BillingCity,
    BillingState = @BillingState,
    BillingZipCode = @BillingZipCode,
    BillingContactName = @BillingContactName,
    BillingContactEmail = @BillingContactEmail,
    IsActive = @IsActive,
    UpdatedAt = GETUTCDATE()
WHERE OrganizationId = @Id;
";

            await _db.ExecuteAsync(sql, new
            {
                Id = id,
                dto.Name,
                dto.Abbreviation,
                dto.City,
                dto.State,
                dto.Country,
                dto.StreetAddress,
                dto.ZipCode,
                dto.DistrictConference,
                dto.Mascot,
                dto.LeagueId,
                dto.PrimaryContactFirstName,
                dto.PrimaryContactLastName,
                dto.PrimaryContactEmail,
                dto.BillingStreetAddress,
                dto.BillingCity,
                dto.BillingState,
                dto.BillingZipCode,
                dto.BillingContactName,
                dto.BillingContactEmail,
                dto.IsActive
            });
        }

        // ============================================================
        // DELETE
        // ============================================================
        public async Task DeleteAsync(Guid id)
        {
            var sql = @"DELETE FROM Organizations WHERE OrganizationId = @Id;";
            await _db.ExecuteAsync(sql, new { Id = id });
        }
    }
}
