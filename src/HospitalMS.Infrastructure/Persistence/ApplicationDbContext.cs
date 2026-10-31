using System.Reflection;
using HospitalMS.Application.Common.Interfaces;
using HospitalMS.Domain.Common;
using HospitalMS.Domain.Entities;
using HospitalMS.Infrastructure.Persistence.Interceptors;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.Infrastructure.Persistence;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>, IApplicationDbContext
{
    private readonly AuditableEntityInterceptor _auditableEntityInterceptor;
    private readonly SoftDeleteInterceptor _softDeleteInterceptor;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        AuditableEntityInterceptor auditableEntityInterceptor,
        SoftDeleteInterceptor softDeleteInterceptor)
        : base(options)
    {
        _auditableEntityInterceptor = auditableEntityInterceptor;
        _softDeleteInterceptor = softDeleteInterceptor;
    }

    public DbSet<Hospital> Hospitals => Set<Hospital>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Customize Identity Table Names
        builder.Entity<ApplicationUser>(entity =>
        {
            entity.ToTable("core_users");
            entity.Property(u => u.FullName).HasMaxLength(150).IsRequired();
            entity.HasOne(u => u.Branch)
                .WithMany(b => b.Users)
                .HasForeignKey(u => u.BranchId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(u => u.Department)
                .WithMany(d => d.Users)
                .HasForeignKey(u => u.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<ApplicationRole>(entity =>
        {
            entity.ToTable("core_roles");
            entity.Property(r => r.Description).HasMaxLength(250);
        });

        builder.Entity<Microsoft.AspNetCore.Identity.IdentityUserRole<Guid>>(entity => entity.ToTable("core_user_roles"));
        builder.Entity<Microsoft.AspNetCore.Identity.IdentityUserClaim<Guid>>(entity => entity.ToTable("core_user_claims"));
        builder.Entity<Microsoft.AspNetCore.Identity.IdentityUserLogin<Guid>>(entity => entity.ToTable("core_user_logins"));
        builder.Entity<Microsoft.AspNetCore.Identity.IdentityRoleClaim<Guid>>(entity => entity.ToTable("core_role_claims"));
        builder.Entity<Microsoft.AspNetCore.Identity.IdentityUserToken<Guid>>(entity => entity.ToTable("core_user_tokens"));

        // Hospital Entity
        builder.Entity<Hospital>(entity =>
        {
            entity.ToTable("core_hospitals");
            entity.HasKey(h => h.Id);
            entity.Property(h => h.Name).HasMaxLength(200).IsRequired();
            entity.Property(h => h.Code).HasMaxLength(50).IsRequired();
            entity.HasIndex(h => h.Code).IsUnique();
        });

        // Branch Entity
        builder.Entity<Branch>(entity =>
        {
            entity.ToTable("core_branches");
            entity.HasKey(b => b.Id);
            entity.Property(b => b.Name).HasMaxLength(150).IsRequired();
            entity.Property(b => b.Code).HasMaxLength(50).IsRequired();
            entity.HasIndex(b => b.Code).IsUnique();

            entity.HasOne(b => b.Hospital)
                .WithMany(h => h.Branches)
                .HasForeignKey(b => b.HospitalId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Department Entity
        builder.Entity<Department>(entity =>
        {
            entity.ToTable("core_departments");
            entity.HasKey(d => d.Id);
            entity.Property(d => d.Name).HasMaxLength(150).IsRequired();
            entity.Property(d => d.Code).HasMaxLength(50).IsRequired();

            entity.HasOne(d => d.Branch)
                .WithMany(b => b.Departments)
                .HasForeignKey(d => d.BranchId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Permission Entity
        builder.Entity<Permission>(entity =>
        {
            entity.ToTable("core_permissions");
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Code).HasMaxLength(100).IsRequired();
            entity.HasIndex(p => p.Code).IsUnique();
        });

        // RolePermission Composite Key
        builder.Entity<RolePermission>(entity =>
        {
            entity.ToTable("core_role_permissions");
            entity.HasKey(rp => new { rp.RoleId, rp.PermissionId });

            entity.HasOne(rp => rp.Role)
                .WithMany(r => r.RolePermissions)
                .HasForeignKey(rp => rp.RoleId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(rp => rp.Permission)
                .WithMany(p => p.RolePermissions)
                .HasForeignKey(rp => rp.PermissionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // RefreshToken Entity
        builder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("core_refresh_tokens");
            entity.HasKey(rt => rt.Id);
            entity.Property(rt => rt.Token).HasMaxLength(256).IsRequired();
            entity.HasIndex(rt => rt.Token).IsUnique();

            entity.HasOne(rt => rt.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // AuditLog Entity
        builder.Entity<AuditLog>(entity =>
        {
            entity.ToTable("core_audit_logs");
            entity.HasKey(al => al.Id);
            entity.Property(al => al.Action).HasMaxLength(100).IsRequired();
            entity.Property(al => al.EntityName).HasMaxLength(100).IsRequired();
            entity.HasIndex(al => al.Timestamp);
        });

        // Global Soft Delete Filter
        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            if (typeof(ISoftDeletable).IsAssignableFrom(entityType.ClrType))
            {
                entityType.AddSoftDeleteQueryFilter();
            }
        }
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.AddInterceptors(_auditableEntityInterceptor, _softDeleteInterceptor);
        base.OnConfiguring(optionsBuilder);
    }
}

public static class ModelBuilderExtensions
{
    public static void AddSoftDeleteQueryFilter(this Microsoft.EntityFrameworkCore.Metadata.IMutableEntityType entityType)
    {
        var parameter = System.Linq.Expressions.Expression.Parameter(entityType.ClrType, "e");
        var property = System.Linq.Expressions.Expression.Property(parameter, nameof(ISoftDeletable.IsDeleted));
        var falseConstant = System.Linq.Expressions.Expression.Constant(false);
        var expression = System.Linq.Expressions.Expression.Equal(property, falseConstant);
        var lambda = System.Linq.Expressions.Expression.Lambda(expression, parameter);

        entityType.SetQueryFilter(lambda);
    }
}

