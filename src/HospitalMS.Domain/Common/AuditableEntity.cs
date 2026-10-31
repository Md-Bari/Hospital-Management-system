namespace HospitalMS.Domain.Common;

public abstract class AuditableEntity : BaseEntity
{
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid? CreatedBy { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public Guid? ModifiedBy { get; set; }
}

