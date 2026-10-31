using HospitalMS.Domain.Common;

namespace HospitalMS.Domain.Entities;

public class Permission : BaseEntity
{
    public string Module { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty; // e.g. Patients.View, Patients.Create
    public string Description { get; set; } = string.Empty;

    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}

public class RolePermission
{
    public Guid RoleId { get; set; }
    public ApplicationRole Role { get; set; } = null!;

    public Guid PermissionId { get; set; }
    public Permission Permission { get; set; } = null!;
}

