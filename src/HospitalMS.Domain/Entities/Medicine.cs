using HospitalMS.Domain.Common;

namespace HospitalMS.Domain.Entities;

public class Medicine : AuditableEntity, ISoftDeletable
{
    public string BrandName { get; set; } = string.Empty;
    public string GenericName { get; set; } = string.Empty;
    public string Manufacturer { get; set; } = string.Empty;
    public string DosageForm { get; set; } = "Tablet"; // Tablet, Capsule, Syrup, Injection, Ointment, Drops
    public string Strength { get; set; } = "500mg";
    public decimal UnitPrice { get; set; }
    public int StockQuantity { get; set; }
    public int ReorderLevel { get; set; } = 50;
    public bool RequiresPrescription { get; set; } = true;
    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }
}

