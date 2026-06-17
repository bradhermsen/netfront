using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NetFrontAPI.DTOs;
using NetFrontAPI.Repositories;
using NetFrontAPI.Models;

namespace NetFrontAPI.Services
{
    public class OrganizationService : IOrganizationService
    {
        private readonly IOrganizationRepository _repo;
        private readonly IUsersRepository _usersRepo;

        public OrganizationService(
            IOrganizationRepository repo,
            IUsersRepository usersRepo)
        {
            _repo = repo;
            _usersRepo = usersRepo;
        }

        public Task<IEnumerable<OrganizationListItemDto>> GetAllAsync()
            => _repo.GetAllAsync();

        public Task<OrganizationDto?> GetByIdAsync(Guid id)
            => _repo.GetByIdAsync(id);

        // ⭐ Returns full Organization
        public async Task<Organization> CreateAsync(CreateOrganizationDto dto)
        {
            var org = new Organization
            {
                Id = Guid.NewGuid(),
                LeagueId = dto.LeagueId,
                Name = dto.Name,
                Abbreviation = dto.Abbreviation,

                StreetAddress = dto.StreetAddress,
                City = dto.City,
                State = dto.State,
                ZipCode = dto.ZipCode,
                Country = dto.Country,

                BillingStreetAddress = dto.BillingStreetAddress,
                BillingCity = dto.BillingCity,
                BillingState = dto.BillingState,
                BillingZipCode = dto.BillingZipCode,
                BillingContactName = dto.BillingContactName,
                BillingContactEmail = dto.BillingContactEmail,

                PrimaryContactFirstName = dto.PrimaryContactFirstName,
                PrimaryContactLastName = dto.PrimaryContactLastName,
                PrimaryContactEmail = dto.PrimaryContactEmail,

                DistrictConference = dto.DistrictConference,
                Mascot = dto.Mascot,
                IsActive = dto.IsActive,

                CreatedAt = DateTime.UtcNow
            };

            await _repo.CreateAsync(org);
            return org;
        }

        // ⭐ Auto-create OrgOwner
        public async Task CreateOrgOwnerForOrganizationAsync(Organization org)
        {
            var tempPassword = "NetFront2024!";
            var hash = BCrypt.Net.BCrypt.HashPassword(tempPassword, 10);

            var authUser = new AuthUser
            {
                Id = Guid.NewGuid(),
                Email = org.PrimaryContactEmail,
                PasswordHash = hash,
                Role = "OrgOwner",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = org.PrimaryContactEmail,
                OrganizationId = org.Id,
                FirstName = org.PrimaryContactFirstName ?? "",
                LastName = org.PrimaryContactLastName ?? "",
                CreatedAt = DateTime.UtcNow
            };

            await _usersRepo.CreateLinkedUserWithHashAsync(authUser, user);
        }

        public Task UpdateAsync(Guid id, UpdateOrganizationDto dto)
            => _repo.UpdateAsync(id, dto);

        public Task DeleteAsync(Guid id)
            => _repo.DeleteAsync(id);
    }
}
