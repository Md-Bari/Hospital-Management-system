using HospitalMS.Application.Common.Interfaces;
using HospitalMS.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.API.Controllers.V1;

public class BillingController : BaseApiController
{
    private readonly IApplicationDbContext _context;

    public BillingController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("invoices")]
    public async Task<ActionResult> GetInvoices(
        [FromQuery] Guid? patientId = null,
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15)
    {
        var query = _context.Invoices
            .Include(i => i.Patient)
            .Include(i => i.Items)
            .Include(i => i.Payments)
            .Where(i => !i.IsDeleted)
            .AsNoTracking();

        if (patientId.HasValue)
            query = query.Where(i => i.PatientId == patientId.Value);

        if (!string.IsNullOrWhiteSpace(status) && status != "All")
            query = query.Where(i => i.Status.ToLower() == status.ToLower());

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(i => i.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(i => new
            {
                i.Id,
                i.InvoiceNumber,
                i.CreatedAt,
                i.SubTotal,
                i.DiscountAmount,
                i.TaxAmount,
                i.TotalAmount,
                TotalAmountDisplay = $"৳{i.TotalAmount:N0}",
                i.PaidAmount,
                PaidAmountDisplay = $"৳{i.PaidAmount:N0}",
                DueAmount = i.TotalAmount - i.PaidAmount,
                DueAmountDisplay = $"৳{(i.TotalAmount - i.PaidAmount):N0}",
                i.Status,
                Patient = new
                {
                    i.Patient.Id,
                    i.Patient.PatientUid,
                    FullName = i.Patient.FirstName + " " + i.Patient.LastName,
                    i.Patient.Phone
                },
                ItemCount = i.Items.Count,
                PaymentCount = i.Payments.Count
            })
            .ToListAsync();

        return Ok(new
        {
            success = true,
            data = new
            {
                items,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            }
        });
    }

    [HttpGet("invoices/{id:guid}")]
    public async Task<ActionResult> GetInvoiceById(Guid id)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Patient)
            .Include(i => i.Items)
            .Include(i => i.Payments)
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);

        if (invoice == null)
            return NotFound(new { success = false, error = "Invoice not found." });

        return Ok(new
        {
            success = true,
            data = new
            {
                invoice.Id,
                invoice.InvoiceNumber,
                invoice.CreatedAt,
                invoice.SubTotal,
                invoice.DiscountAmount,
                invoice.TaxAmount,
                invoice.TotalAmount,
                TotalAmountDisplay = $"৳{invoice.TotalAmount:N0}",
                invoice.PaidAmount,
                PaidAmountDisplay = $"৳{invoice.PaidAmount:N0}",
                DueAmount = invoice.DueAmount,
                DueAmountDisplay = $"৳{invoice.DueAmount:N0}",
                invoice.Status,
                Patient = new
                {
                    invoice.Patient.Id,
                    invoice.Patient.PatientUid,
                    FullName = invoice.Patient.FirstName + " " + invoice.Patient.LastName,
                    invoice.Patient.Phone,
                    invoice.Patient.Address
                },
                Items = invoice.Items.Select(item => new
                {
                    item.Id,
                    item.ItemName,
                    item.ItemType,
                    item.Quantity,
                    item.UnitPrice,
                    UnitPriceDisplay = $"৳{item.UnitPrice:N0}",
                    TotalPrice = item.TotalPrice,
                    TotalPriceDisplay = $"৳{item.TotalPrice:N0}"
                }),
                Payments = invoice.Payments.Select(p => new
                {
                    p.Id,
                    p.PaymentNumber,
                    p.Amount,
                    AmountDisplay = $"৳{p.Amount:N0}",
                    p.PaymentMethod,
                    p.TransactionReference,
                    p.PaidAt,
                    p.Status
                })
            }
        });
    }

    [HttpPost("invoices")]
    public async Task<ActionResult> CreateInvoice([FromBody] CreateInvoiceRequest request)
    {
        if (request.Items == null || request.Items.Count == 0)
            return BadRequest(new { success = false, error = "Invoice must contain at least one item." });

        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.Id == request.PatientId && !p.IsDeleted);
        if (patient == null)
            return BadRequest(new { success = false, error = "Patient not found." });

        var count = await _context.Invoices.CountAsync();
        var invoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{(count + 1):D4}";

        var subTotal = request.Items.Sum(i => i.Quantity * i.UnitPrice);
        var discount = request.DiscountAmount;
        var tax = request.TaxAmount;
        var total = Math.Max(0, subTotal - discount + tax);

        var invoice = new Invoice
        {
            InvoiceNumber = invoiceNumber,
            PatientId = request.PatientId,
            SubTotal = subTotal,
            DiscountAmount = discount,
            TaxAmount = tax,
            TotalAmount = total,
            PaidAmount = 0,
            Status = "Unpaid",
            Items = request.Items.Select(i => new InvoiceItem
            {
                ItemName = i.ItemName.Trim(),
                ItemType = i.ItemType ?? "Service",
                Quantity = i.Quantity <= 0 ? 1 : i.Quantity,
                UnitPrice = i.UnitPrice
            }).ToList()
        };

        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetInvoiceById), new { id = invoice.Id }, new
        {
            success = true,
            data = new
            {
                invoice.Id,
                invoice.InvoiceNumber,
                invoice.TotalAmount,
                TotalAmountDisplay = $"৳{invoice.TotalAmount:N0}",
                invoice.Status
            }
        });
    }

    [HttpPost("payments")]
    public async Task<ActionResult> RecordPayment([FromBody] RecordPaymentRequest request)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == request.InvoiceId && !i.IsDeleted);

        if (invoice == null)
            return NotFound(new { success = false, error = "Invoice not found." });

        if (request.Amount <= 0)
            return BadRequest(new { success = false, error = "Payment amount must be greater than zero." });

        var count = await _context.Payments.CountAsync();
        var paymentNumber = $"PAY-{DateTime.UtcNow:yyyyMMdd}-{(count + 1):D4}";

        var payment = new Payment
        {
            PaymentNumber = paymentNumber,
            InvoiceId = invoice.Id,
            Amount = request.Amount,
            PaymentMethod = request.PaymentMethod ?? "Cash",
            TransactionReference = request.TransactionReference?.Trim(),
            PaidAt = DateTime.UtcNow,
            Status = "Success"
        };

        _context.Payments.Add(payment);
        invoice.PaidAmount += request.Amount;

        if (invoice.PaidAmount >= invoice.TotalAmount)
        {
            invoice.Status = "Paid";
        }
        else if (invoice.PaidAmount > 0)
        {
            invoice.Status = "PartiallyPaid";
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "Payment recorded successfully.",
            data = new
            {
                payment.Id,
                payment.PaymentNumber,
                payment.Amount,
                AmountDisplay = $"৳{payment.Amount:N0}",
                payment.PaymentMethod,
                invoice.PaidAmount,
                invoice.DueAmount,
                invoiceStatus = invoice.Status
            }
        });
    }

    [HttpGet("summary")]
    public async Task<ActionResult> GetBillingSummary()
    {
        var totalBilled = await _context.Invoices.Where(i => !i.IsDeleted).SumAsync(i => i.TotalAmount);
        var totalCollected = await _context.Invoices.Where(i => !i.IsDeleted).SumAsync(i => i.PaidAmount);
        var totalDue = totalBilled - totalCollected;

        var paidCount = await _context.Invoices.CountAsync(i => !i.IsDeleted && i.Status == "Paid");
        var partialCount = await _context.Invoices.CountAsync(i => !i.IsDeleted && i.Status == "PartiallyPaid");
        var unpaidCount = await _context.Invoices.CountAsync(i => !i.IsDeleted && i.Status == "Unpaid");

        return Ok(new
        {
            success = true,
            data = new
            {
                totalBilled,
                totalBilledDisplay = $"৳{totalBilled:N0}",
                totalCollected,
                totalCollectedDisplay = $"৳{totalCollected:N0}",
                totalDue,
                totalDueDisplay = $"৳{totalDue:N0}",
                paidCount,
                partialCount,
                unpaidCount
            }
        });
    }
}

public class CreateInvoiceRequest
{
    public Guid PatientId { get; set; }
    public decimal DiscountAmount { get; set; } = 0;
    public decimal TaxAmount { get; set; } = 0;
    public List<CreateInvoiceItemDto> Items { get; set; } = new();
}

public class CreateInvoiceItemDto
{
    public string ItemName { get; set; } = string.Empty;
    public string? ItemType { get; set; } = "Service";
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
}

public class RecordPaymentRequest
{
    public Guid InvoiceId { get; set; }
    public decimal Amount { get; set; }
    public string? PaymentMethod { get; set; } = "Cash"; // Cash, bKash, Nagad, Card
    public string? TransactionReference { get; set; }
}

