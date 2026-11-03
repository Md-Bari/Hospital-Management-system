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
        [FromQuery] string? search = null,
        [FromQuery] string? itemType = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);

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

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(i =>
                i.InvoiceNumber.ToLower().Contains(term) ||
                i.Patient.PatientUid.ToLower().Contains(term) ||
                (i.Patient.FirstName + " " + i.Patient.LastName).ToLower().Contains(term) ||
                i.Patient.Phone.Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(itemType) && itemType != "All")
        {
            var typeLower = itemType.Trim().ToLower();
            query = query.Where(i => i.Items.Any(item => item.ItemType.ToLower() == typeLower));
        }

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
                PaymentCount = i.Payments.Count,
                PrimaryCategory = i.Items.Select(item => item.ItemType).FirstOrDefault() ?? "General",
                ItemsSummary = string.Join(", ", i.Items.Take(3).Select(item => item.ItemName)) + (i.Items.Count > 3 ? "..." : "")
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
                    invoice.Patient.Address,
                    invoice.Patient.Gender,
                    invoice.Patient.BloodGroup,
                    Age = DateTime.UtcNow.Year - invoice.Patient.DateOfBirth.Year
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

    [HttpGet("services-catalog")]
    public async Task<ActionResult> GetServicesCatalog()
    {
        var doctors = await _context.Doctors
            .Include(d => d.Department)
            .Where(d => d.IsActive && !d.IsDeleted)
            .OrderBy(d => d.FullName)
            .Select(d => new
            {
                d.Id,
                d.FullName,
                d.Specialization,
                Department = d.Department.Name,
                ConsultationFee = d.ConsultationFee > 0 ? d.ConsultationFee : 1000m,
                ConsultationFeeDisplay = $"৳{(d.ConsultationFee > 0 ? d.ConsultationFee : 1000m):N0}"
            })
            .ToListAsync();

        var labTests = await _context.LabTests
            .Where(t => t.IsActive)
            .OrderBy(t => t.Category)
            .ThenBy(t => t.Name)
            .Select(t => new
            {
                t.Id,
                t.Code,
                t.Name,
                t.Category,
                t.SampleType,
                t.Price,
                PriceDisplay = $"৳{t.Price:N0}"
            })
            .ToListAsync();

        var medicines = await _context.Medicines
            .Where(m => m.IsActive && !m.IsDeleted && m.StockQuantity > 0)
            .OrderBy(m => m.BrandName)
            .Select(m => new
            {
                m.Id,
                m.BrandName,
                m.GenericName,
                m.DosageForm,
                m.Strength,
                m.UnitPrice,
                UnitPriceDisplay = $"৳{m.UnitPrice:N0}",
                m.StockQuantity
            })
            .ToListAsync();

        var standardServices = new[]
        {
            // 1. OPD Consultations
            new { Code = "OPD-GP", Name = "General Physician Consultation", Category = "Consultation", UnitPrice = 500m, Description = "Outdoor general medical officer visit" },
            new { Code = "OPD-SPEC", Name = "Specialist Consultant OPD Visit", Category = "Consultation", UnitPrice = 1000m, Description = "Outdoor specialist chamber consultation" },
            new { Code = "OPD-PROF", Name = "Senior Professor / HOD Consultation", Category = "Consultation", UnitPrice = 1500m, Description = "Senior professor specialized consultation" },
            new { Code = "OPD-FOL", Name = "Follow-up Consultation (Within 7 Days)", Category = "Consultation", UnitPrice = 300m, Description = "Report review and prescription follow-up" },
            new { Code = "EMO-VISIT", Name = "Emergency Medical Officer (EMO) Visit", Category = "Consultation", UnitPrice = 600m, Description = "Emergency casualty triage and consultation" },

            // 2. IPD & Beds (Daily Rent)
            new { Code = "BED-GEN", Name = "General Ward Bed (Per Day)", Category = "Bed", UnitPrice = 800m, Description = "Standard male/female inpatient ward" },
            new { Code = "BED-SEMI", Name = "Semi-Cabin Single Bed (Per Day)", Category = "Bed", UnitPrice = 1800m, Description = "Partitioned semi-private cabin" },
            new { Code = "BED-AC", Name = "Deluxe AC Single Cabin (Per Day)", Category = "Bed", UnitPrice = 3500m, Description = "Air-conditioned private cabin with attached bath" },
            new { Code = "BED-VIP", Name = "VIP Executive Suite (Per Day)", Category = "Bed", UnitPrice = 6000m, Description = "Executive suite with patient lounge & attendant room" },
            new { Code = "BED-ICU", Name = "ICU / CCU Life Support Bed (Per Day)", Category = "Bed", UnitPrice = 12000m, Description = "Intensive care bed with continuous ventilator & monitoring" },
            new { Code = "IPD-NURSE", Name = "Inpatient Nursing Care Charge (Per Day)", Category = "Bed", UnitPrice = 500m, Description = "24-hour dedicated inpatient nursing care" },
            new { Code = "IPD-ROUND", Name = "Consultant Daily Inpatient Round (Per Day)", Category = "Bed", UnitPrice = 800m, Description = "Attending consultant daily bedside evaluation" },

            // 3. Procedures & Surgical Packages
            new { Code = "PROC-ND", Name = "Normal Delivery Package", Category = "Procedure", UnitPrice = 18000m, Description = "Labor room, gynecologist, pediatric checkup & 24h bed" },
            new { Code = "PROC-CS", Name = "Caesarean Section (C-Section) Package", Category = "Procedure", UnitPrice = 35000m, Description = "OT charge, surgeon, anesthetist, baby care & 3-day cabin" },
            new { Code = "PROC-MOT", Name = "Minor OT / Stitching / Suturing", Category = "Procedure", UnitPrice = 1500m, Description = "Minor surgical room procedure and local anesthesia" },
            new { Code = "PROC-MAJ", Name = "Major OT Facility Charges (1st Hour)", Category = "Procedure", UnitPrice = 8000m, Description = "Modular operation theatre, laminar airflow & equipment" },
            new { Code = "PROC-DRS", Name = "Wound Dressing & Antiseptic Bandaging", Category = "Procedure", UnitPrice = 350m, Description = "Post-surgical or trauma wound cleaning and dressing" },
            new { Code = "PROC-NEB", Name = "Nebulization Session", Category = "Procedure", UnitPrice = 150m, Description = "Respiratory bronchodilator nebulizer treatment" },
            new { Code = "PROC-CAN", Name = "IV Cannulation & Infusion Set", Category = "Procedure", UnitPrice = 300m, Description = "Cannula insertion, fluid administration setup" },
            new { Code = "PROC-ENDO", Name = "Upper GI Endoscopy Procedure", Category = "Procedure", UnitPrice = 4500m, Description = "Diagnostic video endoscopy with report" },
            new { Code = "PROC-DIAL", Name = "Hemodialysis Session", Category = "Procedure", UnitPrice = 2500m, Description = "Single-use dialyzer renal dialysis session" },
            new { Code = "PROC-ECG", Name = "12-Lead Electrocardiogram (ECG)", Category = "Procedure", UnitPrice = 400m, Description = "Computerized 12-lead ECG with cardiologist interpretation" },
            new { Code = "PROC-USG", Name = "Ultrasonography (USG) Whole Abdomen", Category = "Procedure", UnitPrice = 1800m, Description = "High-resolution 4D color Doppler ultrasound" },
            new { Code = "PROC-XRAY", Name = "Digital X-Ray Chest P/A View", Category = "Procedure", UnitPrice = 600m, Description = "High-frequency digital radiography with film" },

            // 4. General & Emergency Services
            new { Code = "GEN-CARD", Name = "Hospital Registration & Digital Health Card", Category = "General", UnitPrice = 100m, Description = "Lifetime registration and patient portal ID" },
            new { Code = "GEN-AMB", Name = "Hospital Ambulance Service (Dhaka Metro)", Category = "General", UnitPrice = 1500m, Description = "Emergency life-support ambulance transit" },
            new { Code = "GEN-CERT", Name = "Medical Fitness / Health Certificate", Category = "General", UnitPrice = 500m, Description = "Official physician examination certificate" },
            new { Code = "EM-OBS", Name = "Emergency Casualty Observation Bed (Up to 6 Hrs)", Category = "Emergency", UnitPrice = 1200m, Description = "Emergency observation, vital monitoring & fluids" },
            new { Code = "GEN-O2", Name = "Medical Oxygen Therapy (Per Hour)", Category = "General", UnitPrice = 200m, Description = "Central pipeline medical oxygen administration" },
            new { Code = "PROC-CATH", Name = "Foley Catheterization Procedure", Category = "General", UnitPrice = 500m, Description = "Sterile catheter insertion & drainage bag setup" }
        };

        var paymentMethods = new[]
        {
            new { Code = "Cash", Name = "Cash (BDT ৳)" },
            new { Code = "bKash", Name = "bKash Merchant Pay" },
            new { Code = "Nagad", Name = "Nagad Online Pay" },
            new { Code = "Card", Name = "Visa / MasterCard / POS" },
            new { Code = "BankTransfer", Name = "Direct Bank Transfer" }
        };

        return Ok(new
        {
            success = true,
            data = new
            {
                doctors,
                labTests,
                medicines,
                standardServices,
                paymentMethods
            }
        });
    }

    [HttpPost("invoices")]
    public async Task<ActionResult> CreateInvoice([FromBody] CreateInvoiceRequest request)
    {
        if (request.Items == null || request.Items.Count == 0)
            return BadRequest(new { success = false, error = "Invoice must contain at least one billable item." });

        if (request.Items.Any(i => string.IsNullOrWhiteSpace(i.ItemName)))
            return BadRequest(new { success = false, error = "Every invoice line item must have a name." });

        if (request.Items.Any(i => i.Quantity <= 0 || i.UnitPrice < 0))
            return BadRequest(new { success = false, error = "Item quantity must be at least 1 and unit price cannot be negative." });

        if (request.DiscountAmount < 0 || request.TaxAmount < 0)
            return BadRequest(new { success = false, error = "Discount and tax cannot be negative." });

        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.Id == request.PatientId && !p.IsDeleted);
        if (patient == null)
            return BadRequest(new { success = false, error = "Patient record not found." });

        Doctor? doctor = null;
        if (request.DoctorId.HasValue)
        {
            doctor = await _context.Doctors
                .Include(d => d.Department)
                .FirstOrDefaultAsync(d => d.Id == request.DoctorId.Value && !d.IsDeleted);
        }

        var count = await _context.Invoices.IgnoreQueryFilters().CountAsync();
        var invoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{(count + 1):D4}";

        var subTotal = request.Items.Sum(i => i.Quantity * i.UnitPrice);
        var discount = Math.Max(0, request.DiscountAmount);
        if (discount > subTotal) discount = subTotal;

        var tax = Math.Max(0, request.TaxAmount);
        var total = subTotal - discount + tax;

        var amountPaid = Math.Max(0, request.AmountPaid);
        if (amountPaid > total) amountPaid = total;

        var status = amountPaid >= total ? "Paid" : (amountPaid > 0 ? "PartiallyPaid" : "Unpaid");

        var invoice = new Invoice
        {
            InvoiceNumber = invoiceNumber,
            PatientId = request.PatientId,
            SubTotal = subTotal,
            DiscountAmount = discount,
            TaxAmount = tax,
            TotalAmount = total,
            PaidAmount = amountPaid,
            Status = status,
            Items = request.Items.Select(i => new InvoiceItem
            {
                ItemName = i.ItemName.Trim(),
                ItemType = string.IsNullOrWhiteSpace(i.ItemType) ? "Service" : i.ItemType.Trim(),
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice
            }).ToList()
        };

        _context.Invoices.Add(invoice);

        // Record immediate payment if amount collected
        Payment? payment = null;
        if (amountPaid > 0)
        {
            var pCount = await _context.Payments.IgnoreQueryFilters().CountAsync();
            var paymentNumber = $"PAY-{DateTime.UtcNow:yyyyMMdd}-{(pCount + 1):D4}";

            payment = new Payment
            {
                PaymentNumber = paymentNumber,
                Invoice = invoice,
                Amount = amountPaid,
                PaymentMethod = request.PaymentMethod ?? "Cash",
                TransactionReference = request.TransactionReference?.Trim(),
                PaidAt = DateTime.UtcNow,
                Status = "Success"
            };

            _context.Payments.Add(payment);
        }

        // Automatic Inventory adjustment for medicines billed
        var medicineItems = request.Items.Where(i => i.ItemType == "Medicine").ToList();
        if (medicineItems.Count > 0)
        {
            var medNames = medicineItems.Select(m => m.ItemName.ToLower()).ToList();
            var dbMeds = await _context.Medicines
                .Where(m => medNames.Contains(m.BrandName.ToLower()) && !m.IsDeleted)
                .ToListAsync();

            foreach (var medItem in medicineItems)
            {
                var match = dbMeds.FirstOrDefault(m => m.BrandName.Equals(medItem.ItemName, StringComparison.OrdinalIgnoreCase));
                if (match != null)
                {
                    match.StockQuantity = Math.Max(0, match.StockQuantity - medItem.Quantity);
                }
            }
        }

        // Automatic Lab Order requisition generation if diagnostic tests are billed
        LabOrder? createdLabOrder = null;
        var labTestItems = request.Items.Where(i => i.ItemType == "LabTest" || i.ItemType == "Diagnostic").ToList();
        if (request.AutoGenerateLabOrder && labTestItems.Count > 0)
        {
            var testNames = labTestItems.Select(t => t.ItemName.ToLower()).ToList();
            var dbTests = await _context.LabTests
                .Where(t => testNames.Contains(t.Name.ToLower()) && t.IsActive)
                .ToListAsync();

            if (dbTests.Count > 0)
            {
                var labCount = await _context.LabOrders.IgnoreQueryFilters().CountAsync();
                var orderNumber = $"LAB-{DateTime.UtcNow:yyyyMMdd}-{(labCount + 1):D4}";

                createdLabOrder = new LabOrder
                {
                    OrderNumber = orderNumber,
                    PatientId = patient.Id,
                    DoctorId = doctor?.Id,
                    Priority = "Routine",
                    Status = "Pending",
                    TotalAmount = dbTests.Sum(t => t.Price),
                    IsPaid = (status == "Paid"),
                    Items = dbTests.Select(t => new LabOrderItem
                    {
                        LabTestId = t.Id,
                        TestName = t.Name,
                        UnitPrice = t.Price,
                        ReferenceRange = t.ReferenceRange
                    }).ToList()
                };

                _context.LabOrders.Add(createdLabOrder);
            }
        }

        await _context.SaveChangesAsync();

        // Construct Money Receipt & Voucher for instant printing
        var moneyReceipt = new
        {
            receiptNumber = payment?.PaymentNumber ?? $"MR-{invoice.InvoiceNumber}",
            invoiceNumber = invoice.InvoiceNumber,
            date = DateTime.UtcNow.ToString("dd-MM-yyyy hh:mm tt"),
            status = invoice.Status,
            isFullyPaid = invoice.Status == "Paid",
            patient = new
            {
                patient.Id,
                patient.PatientUid,
                fullName = $"{patient.FirstName} {patient.LastName}",
                phone = patient.Phone,
                gender = patient.Gender,
                bloodGroup = patient.BloodGroup,
                age = DateTime.UtcNow.Year - patient.DateOfBirth.Year,
                address = patient.Address
            },
            doctor = doctor != null ? new
            {
                doctor.Id,
                fullName = doctor.FullName,
                specialization = doctor.Specialization,
                department = doctor.Department?.Name ?? "General"
            } : null,
            items = invoice.Items.Select(i => new
            {
                i.Id,
                i.ItemName,
                i.ItemType,
                i.Quantity,
                i.UnitPrice,
                unitPriceDisplay = $"৳{i.UnitPrice:N0}",
                totalPrice = i.TotalPrice,
                totalPriceDisplay = $"৳{i.TotalPrice:N0}"
            }),
            financials = new
            {
                subTotal = invoice.SubTotal,
                subTotalDisplay = $"৳{invoice.SubTotal:N0}",
                discount = invoice.DiscountAmount,
                discountDisplay = $"৳{invoice.DiscountAmount:N0}",
                discountReason = request.DiscountReason ?? "Standard Hospital Tariff",
                tax = invoice.TaxAmount,
                taxDisplay = $"৳{invoice.TaxAmount:N0}",
                totalAmount = invoice.TotalAmount,
                totalAmountDisplay = $"৳{invoice.TotalAmount:N0}",
                paidAmount = invoice.PaidAmount,
                paidAmountDisplay = $"৳{invoice.PaidAmount:N0}",
                dueAmount = invoice.DueAmount,
                dueAmountDisplay = $"৳{invoice.DueAmount:N0}",
                paymentMethod = request.PaymentMethod ?? "Cash",
                transactionReference = request.TransactionReference
            },
            labOrderNumber = createdLabOrder?.OrderNumber,
            cashierName = "Accounts & Billing Desk",
            hospital = new
            {
                name = "Dhaka Specialized General Hospital",
                address = "Plot 14, Road 7, Dhanmondi, Dhaka 1205, Bangladesh",
                hotline = "+880 2 9660000 / +880 1711-000001",
                license = "DGHS-LIC-2026-9812"
            }
        };

        return CreatedAtAction(nameof(GetInvoiceById), new { id = invoice.Id }, new
        {
            success = true,
            message = status == "Paid"
                ? "Bill created and full payment received successfully!"
                : (status == "PartiallyPaid" ? "Bill created with partial payment." : "Bill created. Payment pending."),
            data = new
            {
                invoice.Id,
                invoice.InvoiceNumber,
                invoice.TotalAmount,
                TotalAmountDisplay = $"৳{invoice.TotalAmount:N0}",
                invoice.PaidAmount,
                PaidAmountDisplay = $"৳{invoice.PaidAmount:N0}",
                invoice.DueAmount,
                DueAmountDisplay = $"৳{invoice.DueAmount:N0}",
                invoice.Status,
                moneyReceipt
            }
        });
    }

    [HttpPost("payments")]
    public async Task<ActionResult> RecordPayment([FromBody] RecordPaymentRequest request)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Patient)
            .Include(i => i.Items)
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == request.InvoiceId && !i.IsDeleted);

        if (invoice == null)
            return NotFound(new { success = false, error = "Invoice not found." });

        if (request.Amount <= 0)
            return BadRequest(new { success = false, error = "Payment amount must be greater than zero." });

        if (invoice.Status == "Cancelled")
            return BadRequest(new { success = false, error = "Cannot collect payment on a cancelled invoice." });

        if (invoice.DueAmount <= 0)
            return BadRequest(new { success = false, error = "This invoice is already fully paid." });

        if (request.Amount > invoice.DueAmount)
            return BadRequest(new { success = false, error = $"Payment exceeds the due amount of ৳{invoice.DueAmount:N0}." });

        var count = await _context.Payments.IgnoreQueryFilters().CountAsync();
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

        invoice.Status = invoice.PaidAmount >= invoice.TotalAmount ? "Paid" : "PartiallyPaid";

        // If invoice is now fully paid, synchronize any associated diagnostic lab orders for this patient
        if (invoice.Status == "Paid")
        {
            var testNames = invoice.Items
                .Where(i => i.ItemType == "LabTest" || i.ItemType == "Diagnostic")
                .Select(i => i.ItemName.ToLower())
                .ToList();

            if (testNames.Count > 0)
            {
                var unpaidLabOrders = await _context.LabOrders
                    .Include(lo => lo.Items)
                    .Where(lo => lo.PatientId == invoice.PatientId && !lo.IsPaid && !lo.IsDeleted)
                    .ToListAsync();

                foreach (var lo in unpaidLabOrders)
                {
                    if (lo.Items.Any(item => testNames.Contains(item.TestName.ToLower())))
                    {
                        lo.IsPaid = true;
                    }
                }
            }
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = $"Payment of ৳{payment.Amount:N0} received successfully via {payment.PaymentMethod}.",
            data = new
            {
                payment.Id,
                payment.PaymentNumber,
                payment.Amount,
                AmountDisplay = $"৳{payment.Amount:N0}",
                payment.PaymentMethod,
                invoice.PaidAmount,
                PaidAmountDisplay = $"৳{invoice.PaidAmount:N0}",
                invoice.DueAmount,
                DueAmountDisplay = $"৳{invoice.DueAmount:N0}",
                invoiceStatus = invoice.Status,
                receipt = new
                {
                    receiptNumber = payment.PaymentNumber,
                    invoiceNumber = invoice.InvoiceNumber,
                    paidAmount = payment.Amount,
                    paidAmountDisplay = $"৳{payment.Amount:N0}",
                    totalPaidSoFar = invoice.PaidAmount,
                    remainingDue = invoice.DueAmount,
                    paymentMethod = payment.PaymentMethod,
                    transactionReference = payment.TransactionReference,
                    date = payment.PaidAt.ToString("dd-MM-yyyy hh:mm tt"),
                    patient = new
                    {
                        invoice.Patient.Id,
                        invoice.Patient.PatientUid,
                        fullName = $"{invoice.Patient.FirstName} {invoice.Patient.LastName}",
                        phone = invoice.Patient.Phone
                    }
                }
            }
        });
    }

    [HttpPost("invoices/{id:guid}/cancel")]
    public async Task<ActionResult> CancelInvoice(Guid id, [FromBody] CancelInvoiceRequest request)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);

        if (invoice == null)
            return NotFound(new { success = false, error = "Invoice not found." });

        if (invoice.PaidAmount > 0)
            return BadRequest(new { success = false, error = "Cannot cancel an invoice with recorded payments. Please process a refund or adjust billing." });

        invoice.Status = "Cancelled";
        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = $"Invoice {invoice.InvoiceNumber} cancelled successfully.",
            data = new { invoice.Id, invoice.Status }
        });
    }

    [HttpPost("diagnostic-slip")]
    public async Task<ActionResult> CreateDiagnosticSlip([FromBody] CreateDiagnosticSlipRequest request)
    {
        if (request.TestIds == null || request.TestIds.Count == 0)
            return BadRequest(new { success = false, error = "At least one diagnostic test must be selected." });

        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.Id == request.PatientId && !p.IsDeleted);
        if (patient == null)
            return BadRequest(new { success = false, error = "Patient record not found." });

        Doctor? doctor = null;
        if (request.DoctorId.HasValue)
        {
            doctor = await _context.Doctors.Include(d => d.Department).FirstOrDefaultAsync(d => d.Id == request.DoctorId.Value && !d.IsDeleted);
        }

        var testIds = request.TestIds.Distinct().ToList();
        var selectedTests = await _context.LabTests
            .Where(t => testIds.Contains(t.Id) && t.IsActive)
            .ToListAsync();

        if (selectedTests.Count != testIds.Count)
            return BadRequest(new { success = false, error = "One or more selected diagnostic tests are invalid or inactive." });

        var subTotal = selectedTests.Sum(t => t.Price);
        var discount = Math.Max(0, request.DiscountAmount);
        if (discount > subTotal) discount = subTotal;
        var totalAmount = subTotal - discount;
        var amountPaid = Math.Max(0, request.AmountPaid);
        if (amountPaid > totalAmount) amountPaid = totalAmount;

        var isFullyPaid = amountPaid >= totalAmount;

        // 1. Generate Order Number & Invoice Number
        var labCount = await _context.LabOrders.IgnoreQueryFilters().CountAsync();
        var orderNumber = $"LAB-{DateTime.UtcNow:yyyyMMdd}-{(labCount + 1):D4}";

        var invCount = await _context.Invoices.IgnoreQueryFilters().CountAsync();
        var invoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{(invCount + 1):D4}";

        // 2. Create LabOrder
        var labOrder = new LabOrder
        {
            OrderNumber = orderNumber,
            PatientId = patient.Id,
            DoctorId = doctor?.Id,
            Priority = request.Priority ?? "Routine",
            Status = "Pending",
            TotalAmount = totalAmount,
            IsPaid = isFullyPaid,
            Items = selectedTests.Select(t => new LabOrderItem
            {
                LabTestId = t.Id,
                TestName = t.Name,
                UnitPrice = t.Price,
                ReferenceRange = t.ReferenceRange
            }).ToList()
        };
        _context.LabOrders.Add(labOrder);

        // 3. Create Invoice
        var invoice = new Invoice
        {
            InvoiceNumber = invoiceNumber,
            PatientId = patient.Id,
            SubTotal = subTotal,
            DiscountAmount = discount,
            TaxAmount = 0,
            TotalAmount = totalAmount,
            PaidAmount = amountPaid,
            Status = isFullyPaid ? "Paid" : (amountPaid > 0 ? "PartiallyPaid" : "Unpaid"),
            Items = selectedTests.Select(t => new InvoiceItem
            {
                ItemName = t.Name,
                ItemType = "LabTest",
                Quantity = 1,
                UnitPrice = t.Price
            }).ToList()
        };
        _context.Invoices.Add(invoice);

        // 4. Create Payment Record if amount paid > 0
        Payment? payment = null;
        if (amountPaid > 0)
        {
            var pCount = await _context.Payments.IgnoreQueryFilters().CountAsync();
            var paymentNumber = $"PAY-{DateTime.UtcNow:yyyyMMdd}-{(pCount + 1):D4}";

            payment = new Payment
            {
                PaymentNumber = paymentNumber,
                Invoice = invoice,
                Amount = amountPaid,
                PaymentMethod = request.PaymentMethod ?? "Cash",
                TransactionReference = request.TransactionReference?.Trim(),
                PaidAt = DateTime.UtcNow,
                Status = "Success"
            };
            _context.Payments.Add(payment);
        }

        await _context.SaveChangesAsync();

        // 5. Construct Printable Diagnostic Slip Data
        var slipData = new
        {
            slipNumber = orderNumber,
            orderNumber = orderNumber,
            invoiceNumber = invoice.InvoiceNumber,
            paymentNumber = payment?.PaymentNumber,
            date = DateTime.UtcNow.ToString("dd-MM-yyyy hh:mm tt"),
            status = isFullyPaid ? "Paid" : (amountPaid > 0 ? "Partially Paid" : "Unpaid"),
            isPaid = isFullyPaid,
            priority = labOrder.Priority,
            patient = new
            {
                patient.Id,
                patient.PatientUid,
                fullName = $"{patient.FirstName} {patient.LastName}",
                phone = patient.Phone,
                gender = patient.Gender,
                bloodGroup = patient.BloodGroup,
                age = (DateTime.UtcNow.Year - patient.DateOfBirth.Year)
            },
            doctor = doctor != null ? new
            {
                doctor.Id,
                fullName = doctor.FullName,
                specialization = doctor.Specialization,
                department = doctor.Department?.Name ?? "General"
            } : null,
            tests = selectedTests.Select(t => new
            {
                t.Id,
                t.Code,
                t.Name,
                t.Category,
                t.SampleType,
                price = t.Price,
                priceDisplay = $"৳{t.Price:N0}"
            }),
            financials = new
            {
                subTotal,
                subTotalDisplay = $"৳{subTotal:N0}",
                discount,
                discountDisplay = $"৳{discount:N0}",
                totalAmount,
                totalAmountDisplay = $"৳{totalAmount:N0}",
                paidAmount = amountPaid,
                paidAmountDisplay = $"৳{amountPaid:N0}",
                dueAmount = totalAmount - amountPaid,
                dueAmountDisplay = $"৳{(totalAmount - amountPaid):N0}",
                paymentMethod = request.PaymentMethod ?? "Cash",
                currency = "BDT",
                currencySymbol = "৳"
            },
            instructions = "Please present this diagnostic slip and barcode at the Pathology Sample Collection Counter."
        };

        return Ok(new
        {
            success = true,
            message = isFullyPaid
                ? "Payment received and Diagnostic Slip generated successfully!"
                : "Diagnostic Invoice generated. Note: Payment is pending.",
            data = slipData
        });
    }

    [HttpGet("summary")]
    public async Task<ActionResult> GetBillingSummary()
    {
        var totalBilled = await _context.Invoices.Where(i => !i.IsDeleted && i.Status != "Cancelled").SumAsync(i => i.TotalAmount);
        var totalCollected = await _context.Invoices.Where(i => !i.IsDeleted && i.Status != "Cancelled").SumAsync(i => i.PaidAmount);
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
    public Guid? DoctorId { get; set; }
    public decimal DiscountAmount { get; set; } = 0;
    public string? DiscountReason { get; set; }
    public decimal TaxAmount { get; set; } = 0;
    public decimal AmountPaid { get; set; } = 0;
    public string? PaymentMethod { get; set; } = "Cash";
    public string? TransactionReference { get; set; }
    public string? Notes { get; set; }
    public bool AutoGenerateLabOrder { get; set; } = true;
    public List<CreateInvoiceItemDto> Items { get; set; } = new();
}

public class CreateInvoiceItemDto
{
    public string ItemName { get; set; } = string.Empty;
    public string? ItemType { get; set; } = "Service"; // Consultation, LabTest, Medicine, Bed, Procedure, Emergency, General
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
}

public class RecordPaymentRequest
{
    public Guid InvoiceId { get; set; }
    public decimal Amount { get; set; }
    public string? PaymentMethod { get; set; } = "Cash"; // Cash, bKash, Nagad, Card, BankTransfer
    public string? TransactionReference { get; set; }
}

public class CreateDiagnosticSlipRequest
{
    public Guid PatientId { get; set; }
    public Guid? DoctorId { get; set; }
    public List<Guid> TestIds { get; set; } = new();
    public decimal DiscountAmount { get; set; } = 0;
    public decimal AmountPaid { get; set; }
    public string? PaymentMethod { get; set; } = "Cash"; // Cash, bKash, Nagad, Card
    public string? TransactionReference { get; set; }
    public string? Priority { get; set; } = "Routine"; // Routine, Urgent, STAT
}

public class CancelInvoiceRequest
{
    public string? Reason { get; set; }
}
