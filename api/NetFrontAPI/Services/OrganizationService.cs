using System.Linq;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NetFrontAPI.DTOs;
using NetFrontAPI.Models;
using NetFrontAPI.Repositories;

namespace NetFrontAPI.Services
{
    public class OrganizationService : IOrganizationService
    {
        private readonly IOrganizationRepository _repo;

        public OrganizationService(IOrganizationRepository repo)
        {
            _repo = repo;
        }

        public async Task<IEnumerable<OrganizationDto>> GetAllAsync()
        {
            var orgs = await _repo.GetAllAsync();
            return orgs.Select(MapToDto);
        }

        public async Task<OrganizationDto> GetByIdAsync(Guid id)
        {
            var org = await _repo.GetByIdAsync(id);
            return org == null ? null : MapToDto(org);
        }

        public async Task CreateAsync(CreateOrganizationDto dto)
        {
            var org = MapToModel(dto);
            await _repo.CreateAsync(org);
        }

        public async Task UpdateAsync(Guid id, UpdateOrganizationDto dto)
        {
            var org = MapToModel(dto);
            org.OrganizationId = id;
            await _repo.UpdateAsync(org);
        }

        public async Task DeleteAsync(Guid id)
        {
            await _repo.DeleteAsync(id);
        }

        private OrganizationDto MapToDto(Organization o)
        {
            return new OrganizationDto
            {
                OrganizationId = o.OrganizationId,
                Name = o.Name,
                Abbreviation = o.Abbreviation,
                City = o.City,
                State = o.State,
                Country = o.Country,
                StreetAddress = o.StreetAddress,
                ZipCode = o.ZipCode,
                PrimaryContactFirstName = o.PrimaryContactFirstName,
                PrimaryContactLastName = o.PrimaryContactLastName,
                PrimaryContactEmail = o.PrimaryContactEmail,
                League = o.League,
                DistrictConference = o.DistrictConference,
                BillingStreetAddress = o.BillingStreetAddress,
                BillingCity = o.BillingCity,
                BillingState = o.BillingState,
                BillingZipCode = o.BillingZipCode,
                BillingContactName = o.BillingContactName,
                BillingContactEmail = o.BillingContactEmail
            };
        }

        private Organization MapToModel(CreateOrganizationDto dto)
        {
            return new Organization
            {
                Name = dto.Name,
                Abbreviation = dto.Abbreviation,
                City = dto.City,
                State = dto.State,
                Country = dto.Country,
                StreetAddress = dto.StreetAddress,
                ZipCode = dto.ZipCode,
                PrimaryContactFirstName = dto.PrimaryContactFirstName,
                PrimaryContactLastName = dto.PrimaryContactLastName,
                PrimaryContactEmail = dto.PrimaryContactEmail,
                League = dto.League,
                DistrictConference = dto.DistrictConference,
                BillingStreetAddress = dto.BillingStreetAddress,
                BillingCity = dto.BillingCity,
                BillingState = dto.BillingState,
                BillingZipCode = dto.BillingZipCode,
                BillingContactName = dto.BillingContactName,
                BillingContactEmail = dto.BillingContactEmail
            };
        }
    }
}
