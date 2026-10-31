using HospitalMS.Domain.Common;

namespace HospitalMS.Domain.Entities;

public class Branch : AuditableEntity
{
    public Guid HospitalId { get; set; }
    public Hospital Hospital { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public bool IsMainBranch { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Department> Departments { get; set; } = new List<Department>();
    public ICollection<ApplicationUser> Users { get; set; } = new List<ApplicationUser>();
}

public class Department : AuditableEntity
{
    public Guid BranchId { get; set; }
    public Branch Branch { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string DepartmentType { get; set; } = "Clinical"; // Clinical, Diagnostic, Pharmacy, Admin, Finance
    public bool IsClinical { get; set; } = true;
    public bool IsActive { get; set; } = true;

    public ICollection<ApplicationUser> Users { get; set; } = new List<ApplicationUser>();
}

