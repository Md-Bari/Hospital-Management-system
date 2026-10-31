using HospitalMS.Domain.Common;

namespace HospitalMS.Domain.Entities;

public class Invoice : AuditableEntity, ISoftDeletable
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public decimal SubTotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal DueAmount => TotalAmount - PaidAmount;
    public string Status { get; set; } = "Unpaid"; // Unpaid, PartiallyPaid, Paid, Cancelled

    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}

public class InvoiceItem : BaseEntity
{
    public Guid InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = null!;

    public string ItemName { get; set; } = string.Empty;
    public string ItemType { get; set; } = "Consultation"; // Consultation, LabTest, Medicine, Bed, Procedure
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice => Quantity * UnitPrice;
}

public class Payment : AuditableEntity
{
    public string PaymentNumber { get; set; } = string.Empty;
    public Guid InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = null!;

    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = "Cash"; // Cash, Card, bKash, Nagad, BankTransfer
    public string? TransactionReference { get; set; }
    public DateTime PaidAt { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Success";
}

