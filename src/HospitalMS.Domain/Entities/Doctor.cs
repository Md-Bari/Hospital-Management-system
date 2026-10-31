using HospitalMS.Domain.Common;

namespace HospitalMS.Domain.Entities;

public class Doctor : AuditableEntity, ISoftDeletable
{
    public Guid? UserId { get; set; }
    public ApplicationUser? User { get; set; }

    public Guid DepartmentId { get; set; }
    public Department Department { get; set; } = null!;

    public string FullName { get; set; } = string.Empty;
    public string LicenseNumber { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public string Qualifications { get; set; } = string.Empty;
    public decimal ConsultationFee { get; set; }
    public int FollowUpDays { get; set; } = 7;
    public string? RoomNumber { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? AvatarUrl { get; set; }
    public bool IsAvailable { get; set; } = true;
    public bool IsAvailableTelemedicine { get; set; } = false;
    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    public ICollection<DoctorSchedule> Schedules { get; set; } = new List<DoctorSchedule>();
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public ICollection<ClinicalEncounter> Encounters { get; set; } = new List<ClinicalEncounter>();
}

public class DoctorSchedule : BaseEntity
{
    public Guid DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;

    public DayOfWeek DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public int MaxPatients { get; set; } = 30;
    public int SlotDurationMinutes { get; set; } = 15;
    public bool IsActive { get; set; } = true;
}
