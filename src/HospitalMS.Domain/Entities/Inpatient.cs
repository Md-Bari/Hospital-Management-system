using HospitalMS.Domain.Common;

namespace HospitalMS.Domain.Entities;

public class Ward : AuditableEntity, ISoftDeletable
{
    public Guid? BranchId { get; set; }
    public Branch? Branch { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty; // e.g., MMW, FSW, CAB, ICU
    public string WardType { get; set; } = "General"; // General, SemiCabin, Cabin, VIP, HDU, ICU, CCU
    public int FloorNumber { get; set; } = 1;
    public string GenderRestriction { get; set; } = "Any"; // Any, Male, Female
    public decimal DailyRate { get; set; }
    public int TotalBeds { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Bed> Beds { get; set; } = new List<Bed>();

    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }
}

public class Bed : AuditableEntity, ISoftDeletable
{
    public Guid WardId { get; set; }
    public Ward Ward { get; set; } = null!;

    public string BedNumber { get; set; } = string.Empty; // e.g. W2-101, CAB-401, ICU-01
    public string BedType { get; set; } = "Standard"; // Standard, SemiFowler, FullFowler, ICU_Ventilator, Electric
    public decimal DailyRate { get; set; }
    public string Status { get; set; } = "Available"; // Available, Occupied, Cleaning, Maintenance
    public Guid? CurrentAdmissionId { get; set; }

    public ICollection<InpatientAdmission> Admissions { get; set; } = new List<InpatientAdmission>();

    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }
}

public class InpatientAdmission : AuditableEntity, ISoftDeletable
{
    public string AdmissionNumber { get; set; } = string.Empty; // IPD-YYYYMMDD-XXXX

    public Guid PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public Guid DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;

    public Guid WardId { get; set; }
    public Ward Ward { get; set; } = null!;

    public Guid BedId { get; set; }
    public Bed Bed { get; set; } = null!;

    public DateTime AdmissionDate { get; set; }
    public DateTime? DischargeDate { get; set; }
    public string Status { get; set; } = "Admitted"; // Admitted, Discharged, Transferred, Cancelled

    public string ProvisionalDiagnosis { get; set; } = string.Empty;
    public string AdmissionPriority { get; set; } = "Routine"; // Routine, Urgent, Emergency
    public decimal InitialDeposit { get; set; }
    public int EstimatedDays { get; set; } = 3;

    public string? CareInstructions { get; set; }
    public string? DischargeSummary { get; set; }
    public string? AdmittedByRole { get; set; }
    public Guid? AdmittedByUserId { get; set; }

    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }
}

