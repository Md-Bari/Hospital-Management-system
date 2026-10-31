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

    DbSet<Patient> Patients { get; }
    DbSet<Doctor> Doctors { get; }
    DbSet<DoctorSchedule> DoctorSchedules { get; }
    DbSet<Appointment> Appointments { get; }
    DbSet<ClinicalEncounter> ClinicalEncounters { get; }
    DbSet<Prescription> Prescriptions { get; }
    DbSet<PrescriptionMedicine> PrescriptionMedicines { get; }
    DbSet<LabTest> LabTests { get; }
    DbSet<LabOrder> LabOrders { get; }
    DbSet<LabOrderItem> LabOrderItems { get; }
    DbSet<Medicine> Medicines { get; }
    DbSet<Invoice> Invoices { get; }
    DbSet<InvoiceItem> InvoiceItems { get; }
    DbSet<Payment> Payments { get; }

    DbSet<TEntity> Set<TEntity>() where TEntity : class;

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
