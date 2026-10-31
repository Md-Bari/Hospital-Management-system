using HospitalMS.Domain.Common;

namespace HospitalMS.Domain.Entities;

public class Prescription : AuditableEntity, ISoftDeletable
{
    public string PrescriptionNumber { get; set; } = string.Empty;
    public Guid? EncounterId { get; set; }
    public ClinicalEncounter? Encounter { get; set; }

    public Guid PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public Guid DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;

    public string? DoctorNotes { get; set; }
    public string? LifestyleAdvice { get; set; }
    public DateTime? FollowUpDate { get; set; }
    public string Status { get; set; } = "Active"; // Active, Dispensed, Cancelled

    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    public ICollection<PrescriptionMedicine> Medicines { get; set; } = new List<PrescriptionMedicine>();
}

public class PrescriptionMedicine : BaseEntity
{
    public Guid PrescriptionId { get; set; }
    public Prescription Prescription { get; set; } = null!;

    public string MedicineName { get; set; } = string.Empty;
    public string? GenericName { get; set; }
    public string Dosage { get; set; } = "1-0-1"; // Morning-Noon-Night
    public string Frequency { get; set; } = "Daily";
    public int DurationDays { get; set; } = 7;
    public int TotalQuantity { get; set; } = 14;
    public string MealInstruction { get; set; } = "After Meal"; // Before Meal, After Meal, With Meal
    public string? SpecialInstructions { get; set; }
}

