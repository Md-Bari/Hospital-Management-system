using HospitalMS.Domain.Common;

namespace HospitalMS.Domain.Entities;

public class ClinicalEncounter : AuditableEntity, ISoftDeletable
{
    public string EncounterNumber { get; set; } = string.Empty;
    public Guid? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }

    public Guid PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public Guid DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;

    public DateTime EncounterDateTime { get; set; } = DateTime.UtcNow;

    // Vitals
    public decimal? SystolicBp { get; set; }
    public decimal? DiastolicBp { get; set; }
    public decimal? PulseRate { get; set; }
    public decimal? TemperatureCelsius { get; set; }
    public decimal? Spo2Percentage { get; set; }
    public decimal? WeightKg { get; set; }
    public decimal? HeightCm { get; set; }

    // Clinical Notes
    public string ChiefComplaints { get; set; } = string.Empty;
    public string? HistoryOfPresentIllness { get; set; }
    public string? ExaminationFindings { get; set; }
    public string Diagnosis { get; set; } = string.Empty;
    public string? TreatmentPlan { get; set; }
    public string? FollowUpInstructions { get; set; }

    public string Status { get; set; } = "Completed"; // Draft, InProgress, Completed
    public DateTime? FinalizedAt { get; set; }

    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    public Prescription? Prescription { get; set; }
}
