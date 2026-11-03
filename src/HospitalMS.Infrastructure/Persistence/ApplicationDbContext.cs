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

    // Healthcare Operational Entities
    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<Doctor> Doctors => Set<Doctor>();
    public DbSet<DoctorSchedule> DoctorSchedules => Set<DoctorSchedule>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<ClinicalEncounter> ClinicalEncounters => Set<ClinicalEncounter>();
    public DbSet<Prescription> Prescriptions => Set<Prescription>();
    public DbSet<PrescriptionMedicine> PrescriptionMedicines => Set<PrescriptionMedicine>();
    public DbSet<LabTest> LabTests => Set<LabTest>();
    public DbSet<LabOrder> LabOrders => Set<LabOrder>();
    public DbSet<LabOrderItem> LabOrderItems => Set<LabOrderItem>();
    public DbSet<Medicine> Medicines => Set<Medicine>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<Payment> Payments => Set<Payment>();

    public DbSet<Ward> Wards => Set<Ward>();
    public DbSet<Bed> Beds => Set<Bed>();
    public DbSet<InpatientAdmission> InpatientAdmissions => Set<InpatientAdmission>();

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

        // Patient Entity
        builder.Entity<Patient>(entity =>
        {
            entity.ToTable("pat_patients");
            entity.HasKey(p => p.Id);
            entity.Property(p => p.PatientUid).HasMaxLength(50).IsRequired();
            entity.HasIndex(p => p.PatientUid).IsUnique();
            entity.Property(p => p.Phone).HasMaxLength(20).IsRequired();
            entity.HasIndex(p => p.Phone);
        });

        // Doctor Entity
        builder.Entity<Doctor>(entity =>
        {
            entity.ToTable("cln_doctors");
            entity.HasKey(d => d.Id);
            entity.Property(d => d.FullName).HasMaxLength(150).IsRequired();
            entity.Property(d => d.ConsultationFee).HasPrecision(18, 2);

            entity.HasOne(d => d.Department)
                .WithMany()
                .HasForeignKey(d => d.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(d => d.User)
                .WithOne()
                .HasForeignKey<Doctor>(d => d.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<DoctorSchedule>(entity =>
        {
            entity.ToTable("cln_doctor_schedules");
            entity.HasKey(s => s.Id);

            entity.HasOne(s => s.Doctor)
                .WithMany(d => d.Schedules)
                .HasForeignKey(s => s.DoctorId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Appointment Entity
        builder.Entity<Appointment>(entity =>
        {
            entity.ToTable("cln_appointments");
            entity.HasKey(a => a.Id);
            entity.Property(a => a.AppointmentNumber).HasMaxLength(50).IsRequired();
            entity.HasIndex(a => a.AppointmentNumber).IsUnique();
            entity.Property(a => a.FeeAmount).HasPrecision(18, 2);

            entity.HasOne(a => a.Patient)
                .WithMany(p => p.Appointments)
                .HasForeignKey(a => a.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(a => a.Doctor)
                .WithMany(d => d.Appointments)
                .HasForeignKey(a => a.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Clinical Encounter Entity
        builder.Entity<ClinicalEncounter>(entity =>
        {
            entity.ToTable("cln_encounters");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.EncounterNumber).HasMaxLength(50).IsRequired();

            entity.HasOne(e => e.Patient)
                .WithMany(p => p.Encounters)
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Doctor)
                .WithMany(d => d.Encounters)
                .HasForeignKey(e => e.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Appointment)
                .WithMany()
                .HasForeignKey(e => e.AppointmentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Prescription Entity
        builder.Entity<Prescription>(entity =>
        {
            entity.ToTable("cln_prescriptions");
            entity.HasKey(p => p.Id);
            entity.Property(p => p.PrescriptionNumber).HasMaxLength(50).IsRequired();

            entity.HasOne(p => p.Patient)
                .WithMany(pt => pt.Prescriptions)
                .HasForeignKey(p => p.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(p => p.Doctor)
                .WithMany()
                .HasForeignKey(p => p.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(p => p.Encounter)
                .WithOne(e => e.Prescription)
                .HasForeignKey<Prescription>(p => p.EncounterId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<PrescriptionMedicine>(entity =>
        {
            entity.ToTable("cln_prescription_medicines");
            entity.HasKey(pm => pm.Id);

            entity.HasOne(pm => pm.Prescription)
                .WithMany(p => p.Medicines)
                .HasForeignKey(pm => pm.PrescriptionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Lab Test & Lab Order Entities
        builder.Entity<LabTest>(entity =>
        {
            entity.ToTable("diag_lab_tests");
            entity.HasKey(lt => lt.Id);
            entity.Property(lt => lt.Code).HasMaxLength(50).IsRequired();
            entity.HasIndex(lt => lt.Code).IsUnique();
            entity.Property(lt => lt.Price).HasPrecision(18, 2);
        });

        builder.Entity<LabOrder>(entity =>
        {
            entity.ToTable("diag_lab_orders");
            entity.HasKey(lo => lo.Id);
            entity.Property(lo => lo.OrderNumber).HasMaxLength(50).IsRequired();
            entity.Property(lo => lo.TotalAmount).HasPrecision(18, 2);

            entity.HasOne(lo => lo.Patient)
                .WithMany()
                .HasForeignKey(lo => lo.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(lo => lo.Doctor)
                .WithMany()
                .HasForeignKey(lo => lo.DoctorId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<LabOrderItem>(entity =>
        {
            entity.ToTable("diag_lab_order_items");
            entity.HasKey(loi => loi.Id);
            entity.Property(loi => loi.UnitPrice).HasPrecision(18, 2);

            entity.HasOne(loi => loi.LabOrder)
                .WithMany(lo => lo.Items)
                .HasForeignKey(loi => loi.LabOrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(loi => loi.LabTest)
                .WithMany()
                .HasForeignKey(loi => loi.LabTestId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Pharmacy Medicine Entity
        builder.Entity<Medicine>(entity =>
        {
            entity.ToTable("phm_medicines");
            entity.HasKey(m => m.Id);
            entity.Property(m => m.BrandName).HasMaxLength(150).IsRequired();
            entity.Property(m => m.UnitPrice).HasPrecision(18, 2);
        });

        // Billing Entities
        builder.Entity<Invoice>(entity =>
        {
            entity.ToTable("bil_invoices");
            entity.HasKey(i => i.Id);
            entity.Property(i => i.InvoiceNumber).HasMaxLength(50).IsRequired();
            entity.Property(i => i.SubTotal).HasPrecision(18, 2);
            entity.Property(i => i.DiscountAmount).HasPrecision(18, 2);
            entity.Property(i => i.TaxAmount).HasPrecision(18, 2);
            entity.Property(i => i.TotalAmount).HasPrecision(18, 2);
            entity.Property(i => i.PaidAmount).HasPrecision(18, 2);

            entity.HasOne(i => i.Patient)
                .WithMany()
                .HasForeignKey(i => i.PatientId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<InvoiceItem>(entity =>
        {
            entity.ToTable("bil_invoice_items");
            entity.HasKey(ii => ii.Id);
            entity.Property(ii => ii.UnitPrice).HasPrecision(18, 2);

            entity.HasOne(ii => ii.Invoice)
                .WithMany(i => i.Items)
                .HasForeignKey(ii => ii.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Payment>(entity =>
        {
            entity.ToTable("bil_payments");
            entity.HasKey(p => p.Id);
            entity.Property(p => p.PaymentNumber).HasMaxLength(50).IsRequired();
            entity.Property(p => p.Amount).HasPrecision(18, 2);

            entity.HasOne(p => p.Invoice)
                .WithMany(i => i.Payments)
                .HasForeignKey(p => p.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Inpatient Management (IPD)
        builder.Entity<Ward>(entity =>
        {
            entity.ToTable("ipd_wards");
            entity.HasKey(w => w.Id);
            entity.Property(w => w.Name).HasMaxLength(150).IsRequired();
            entity.Property(w => w.Code).HasMaxLength(50).IsRequired();
            entity.Property(w => w.WardType).HasMaxLength(50).IsRequired();
            entity.Property(w => w.GenderRestriction).HasMaxLength(20).IsRequired();
            entity.Property(w => w.DailyRate).HasPrecision(18, 2);

            entity.HasOne(w => w.Branch)
                .WithMany()
                .HasForeignKey(w => w.BranchId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<Bed>(entity =>
        {
            entity.ToTable("ipd_beds");
            entity.HasKey(b => b.Id);
            entity.Property(b => b.BedNumber).HasMaxLength(50).IsRequired();
            entity.Property(b => b.BedType).HasMaxLength(50).IsRequired();
            entity.Property(b => b.Status).HasMaxLength(30).IsRequired();
            entity.Property(b => b.DailyRate).HasPrecision(18, 2);

            entity.HasOne(b => b.Ward)
                .WithMany(w => w.Beds)
                .HasForeignKey(b => b.WardId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<InpatientAdmission>(entity =>
        {
            entity.ToTable("ipd_admissions");
            entity.HasKey(a => a.Id);
            entity.Property(a => a.AdmissionNumber).HasMaxLength(50).IsRequired();
            entity.Property(a => a.Status).HasMaxLength(30).IsRequired();
            entity.Property(a => a.ProvisionalDiagnosis).HasMaxLength(300).IsRequired();
            entity.Property(a => a.AdmissionPriority).HasMaxLength(30).IsRequired();
            entity.Property(a => a.InitialDeposit).HasPrecision(18, 2);

            entity.HasOne(a => a.Patient)
                .WithMany()
                .HasForeignKey(a => a.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(a => a.Doctor)
                .WithMany()
                .HasForeignKey(a => a.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(a => a.Ward)
                .WithMany()
                .HasForeignKey(a => a.WardId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(a => a.Bed)
                .WithMany(b => b.Admissions)
                .HasForeignKey(a => a.BedId)
                .OnDelete(DeleteBehavior.Restrict);
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
        optionsBuilder.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
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
