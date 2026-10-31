using HospitalMS.Domain.Common;

namespace HospitalMS.Domain.Entities;

public class Patient : AuditableEntity, ISoftDeletable
{
    public string PatientUid { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}".Trim();
    public DateTime DateOfBirth { get; set; }
    public string Gender { get; set; } = "Other"; // Male, Female, Other
    public string BloodGroup { get; set; } = "Unknown"; // A+, B+, O+, AB+, etc.
    public string? NationalId { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Address { get; set; } = string.Empty;
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string MaritalStatus { get; set; } = "Single";
    public string? KnownAllergies { get; set; }
    public string? ChronicConditions { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public ICollection<ClinicalEncounter> Encounters { get; set; } = new List<ClinicalEncounter>();
    public ICollection<Prescription> Prescriptions { get; set; } = new List<Prescription>();
}

