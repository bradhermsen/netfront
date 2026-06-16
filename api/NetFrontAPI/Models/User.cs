using System;

namespace NetFrontAPI.Models
{
    public class User
    {
        public Guid Id { get; set; }
        public Guid? OrganizationId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
