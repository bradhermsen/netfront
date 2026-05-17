using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Data;
using Dapper;
using NetFrontAPI.Models;

namespace NetFrontAPI.Repositories
{
    public class OrganizationRepository : IOrganizationRepository
    {
        private readonly IDbConnection _db;

        public OrganizationRepository(IDbConnection db)
        {
            _db = db;
        }

        public async Task<IEnumerable<Organization>> GetAllAsync()
        {
            var sql = @"SELECT * FROM Organizations ORDER BY Name";
            return await _db.QueryAsync<Organization>(sql);
        }

        public async Task<Organization> GetByIdAsync(Guid id)
        {
            var sql = @"SELECT * FROM Organizations WHERE OrganizationId = @Id";
            return await _db.QueryFirstOrDefaultAsync<Organization>(sql, new { Id = id });
        }

        public async Task CreateAsync(Organization org)
        {
            org.OrganizationId = Guid.NewGuid();

            var sql = @"
                INSERT INTO Organizations (
                    OrganizationId, Name, Abbreviation,
                    City, State, Country, StreetAddress, ZipCode,
                    PrimaryContactFirstName, PrimaryContactLastName, PrimaryContactEmail,
                    League, DistrictConference,
                    BillingStreetAddress, BillingCity, BillingState, BillingZipCode,
                    BillingContactName, BillingContactEmail
                )
                VALUES (
                    @OrganizationId, @Name, @Abbreviation,
                    @City, @State, @Country, @StreetAddress, @ZipCode,
                    @PrimaryContactFirstName, @PrimaryContactLastName, @PrimaryContactEmail,
                    @League, @DistrictConference,
                    @BillingStreetAddress, @BillingCity, @BillingState, @BillingZipCode,
                    @BillingContactName, @BillingContactEmail
                )";

            await _db.ExecuteAsync(sql, org);
        }

        public async Task UpdateAsync(Organization org)
        {
            var sql = @"
                UPDATE Organizations SET
                    Name = @Name,
                    Abbreviation = @Abbreviation,
                    City = @City,
                    State = @State,
                    Country = @Country,
                    StreetAddress = @StreetAddress,
                    ZipCode = @ZipCode,
                    PrimaryContactFirstName = @PrimaryContactFirstName,
                    PrimaryContactLastName = @PrimaryContactLastName,
                    PrimaryContactEmail = @PrimaryContactEmail,
                    League = @League,
                    DistrictConference = @DistrictConference,
                    BillingStreetAddress = @BillingStreetAddress,
                    BillingCity = @BillingCity,
                    BillingState = @BillingState,
                    BillingZipCode = @BillingZipCode,
                    BillingContactName = @BillingContactName,
                    BillingContactEmail = @BillingContactEmail
                WHERE OrganizationId = @OrganizationId";

            await _db.ExecuteAsync(sql, org);
        }

        public async Task DeleteAsync(Guid id)
        {
            var sql = @"DELETE FROM Organizations WHERE OrganizationId = @Id";
            await _db.ExecuteAsync(sql, new { Id = id });
        }
    }
}
