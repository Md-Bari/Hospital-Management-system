using HospitalMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Hospital> Hospitals { get; }
    DbSet<Branch> Branches { get; }
    DbSet<Department> Departments { get; }
    DbSet<ApplicationUser> Users { get; }
    DbSet<ApplicationRole> Roles { get; }
    DbSet<Permission> Permissions { get; }
    DbSet<RolePermission> RolePermissions { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<AuditLog> AuditLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

