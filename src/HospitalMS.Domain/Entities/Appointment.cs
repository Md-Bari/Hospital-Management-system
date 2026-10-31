using HospitalMS.Domain.Common;

namespace HospitalMS.Domain.Entities;

public class Appointment : AuditableEntity, ISoftDeletable
{
    public string AppointmentNumber { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public Guid DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;

    public Guid? BranchId { get; set; }
    public Branch? Branch { get; set; }

    public DateTime AppointmentDate { get; set; }
    public TimeSpan SlotStartTime { get; set; }
    public TimeSpan SlotEndTime { get; set; }
    public string AppointmentType { get; set; } = "InPerson"; // InPerson, Telemedicine
    public string Status { get; set; } = "Scheduled"; // Scheduled, Confirmed, CheckedIn, InConsultation, Completed, Cancelled
    public int QueueSerialNumber { get; set; }
    public decimal FeeAmount { get; set; }
    public bool IsPaid { get; set; }
    public string? Reason { get; set; }
    public string? CancellationReason { get; set; }

    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }
}

