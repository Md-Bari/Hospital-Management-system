using HospitalMS.Domain.Common;

namespace HospitalMS.Domain.Entities;

public class LabTest : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = "Hematology"; // Hematology, Biochemistry, Radiology, Microbiology, Pathology
    public string SampleType { get; set; } = "Blood"; // Blood, Urine, Stool, Swab, Imaging
    public decimal Price { get; set; }
    public int TurnaroundHours { get; set; } = 24;
    public string? ReferenceRange { get; set; }
    public bool IsActive { get; set; } = true;
}

public class LabOrder : AuditableEntity, ISoftDeletable
{
    public string OrderNumber { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public Guid? DoctorId { get; set; }
    public Doctor? Doctor { get; set; }

    public string Priority { get; set; } = "Routine"; // Routine, Urgent, STAT
    public string Status { get; set; } = "Pending"; // Pending, SampleCollected, InProcess, Completed, Cancelled
    public decimal TotalAmount { get; set; }
    public bool IsPaid { get; set; }

    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    public ICollection<LabOrderItem> Items { get; set; } = new List<LabOrderItem>();
}

public class LabOrderItem : BaseEntity
{
    public Guid LabOrderId { get; set; }
    public LabOrder LabOrder { get; set; } = null!;

    public Guid LabTestId { get; set; }
    public LabTest LabTest { get; set; } = null!;

    public string TestName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public string? ResultValue { get; set; }
    public string? ReferenceRange { get; set; }
    public bool? IsAbnormal { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Completed
    public DateTime? ResultEnteredAt { get; set; }
}
