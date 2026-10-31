using HospitalMS.Domain.Common;

namespace HospitalMS.Domain.Entities;

public class Hospital : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string LicenseNumber { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string Currency { get; set; } = "BDT";
    public string TimeZone { get; set; } = "Asia/Dhaka";
    public bool IsActive { get; set; } = true;

    public ICollection<Branch> Branches { get; set; } = new List<Branch>();
}

