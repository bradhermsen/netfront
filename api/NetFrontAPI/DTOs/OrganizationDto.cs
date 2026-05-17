using System;

namespace NetFrontAPI.DTOs
{
    public class OrganizationDto
    {
        public Guid OrganizationId { get; set; }

        public string Name { get; set; }
        public string Abbreviation { get; set; }

        public string City { get; set; }
        public string State { get; set; }
        public string Country { get; set; }
        public string StreetAddress { get; set; }
        public string ZipCode { get; set; }

        public string PrimaryContactFirstName { get; set; }
        public string PrimaryContactLastName { get; set; }
        public string PrimaryContactEmail { get; set; }

        public string League { get; set; }
        public string DistrictConference { get; set; }

        public string BillingStreetAddress { get; set; }
        public string BillingCity { get; set; }
        public string BillingState { get; set; }
        public string BillingZipCode { get; set; }
        public string BillingContactName { get; set; }
        public string BillingContactEmail { get; set; }
    }
}
