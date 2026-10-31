using HospitalMS.Application.Common.Interfaces;
using HospitalMS.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.API.Controllers.V1;

public class PharmacyController : BaseApiController
{
    private readonly IApplicationDbContext _context;

    public PharmacyController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("medicines")]
    public async Task<ActionResult> GetMedicines(
        [FromQuery] string? search = null,
        [FromQuery] bool? lowStock = null,
        [FromQuery] string? dosageForm = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15)
    {
        var query = _context.Medicines
            .Where(m => !m.IsDeleted && m.IsActive)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim().ToLower();
            query = query.Where(m =>
                m.BrandName.ToLower().Contains(search) ||
                m.GenericName.ToLower().Contains(search) ||
                m.Manufacturer.ToLower().Contains(search));
        }

        if (lowStock == true)
        {
            query = query.Where(m => m.StockQuantity <= m.ReorderLevel);
        }

        if (!string.IsNullOrWhiteSpace(dosageForm) && dosageForm != "All")
        {
            query = query.Where(m => m.DosageForm.ToLower() == dosageForm.ToLower());
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(m => m.BrandName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new
            {
                m.Id,
                m.BrandName,
                m.GenericName,
                m.Manufacturer,
                m.DosageForm,
                m.Strength,
                m.UnitPrice,
                UnitPriceDisplay = $"৳{m.UnitPrice:N2}",
                m.StockQuantity,
                m.ReorderLevel,
                IsLowStock = m.StockQuantity <= m.ReorderLevel,
                m.RequiresPrescription
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

    [HttpGet("medicines/{id:guid}")]
    public async Task<ActionResult> GetMedicineById(Guid id)
    {
        var medicine = await _context.Medicines
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == id && !m.IsDeleted);

        if (medicine == null)
            return NotFound(new { success = false, error = "Medicine not found." });

        return Ok(new
        {
            success = true,
            data = new
            {
                medicine.Id,
                medicine.BrandName,
                medicine.GenericName,
                medicine.Manufacturer,
                medicine.DosageForm,
                medicine.Strength,
                medicine.UnitPrice,
                UnitPriceDisplay = $"৳{medicine.UnitPrice:N2}",
                medicine.StockQuantity,
                medicine.ReorderLevel,
                IsLowStock = medicine.StockQuantity <= medicine.ReorderLevel,
                medicine.RequiresPrescription,
                medicine.IsActive
            }
        });
    }

    [HttpPost("medicines")]
    public async Task<ActionResult> CreateMedicine([FromBody] CreateMedicineRequest request)
    {
        var medicine = new Medicine
        {
            BrandName = request.BrandName.Trim(),
            GenericName = request.GenericName.Trim(),
            Manufacturer = request.Manufacturer.Trim(),
            DosageForm = request.DosageForm ?? "Tablet",
            Strength = request.Strength ?? "500mg",
            UnitPrice = request.UnitPrice,
            StockQuantity = request.StockQuantity,
            ReorderLevel = request.ReorderLevel <= 0 ? 50 : request.ReorderLevel,
            RequiresPrescription = request.RequiresPrescription,
            IsActive = true
        };

        _context.Medicines.Add(medicine);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMedicineById), new { id = medicine.Id }, new { success = true, data = medicine });
    }

    [HttpPost("medicines/{id:guid}/stock")]
    public async Task<ActionResult> AdjustStock(Guid id, [FromBody] AdjustStockRequest request)
    {
        var medicine = await _context.Medicines.FirstOrDefaultAsync(m => m.Id == id && !m.IsDeleted);
        if (medicine == null)
            return NotFound(new { success = false, error = "Medicine not found." });

        medicine.StockQuantity += request.QuantityDelta;
        if (medicine.StockQuantity < 0) medicine.StockQuantity = 0;

        await _context.SaveChangesAsync();
        return Ok(new
        {
            success = true,
            data = new
            {
                medicine.Id,
                medicine.BrandName,
                medicine.StockQuantity,
                IsLowStock = medicine.StockQuantity <= medicine.ReorderLevel
            }
        });
    }

    [HttpPost("dispense")]
    public async Task<ActionResult> Dispense([FromBody] DispenseRequest request)
    {
        var dispensedItems = new List<object>();

        foreach (var item in request.Items)
        {
            var med = await _context.Medicines.FirstOrDefaultAsync(m => m.Id == item.MedicineId);
            if (med != null)
            {
                var qtyToDeduct = Math.Min(item.Quantity, med.StockQuantity);
                med.StockQuantity -= qtyToDeduct;
                dispensedItems.Add(new
                {
                    med.BrandName,
                    DispensedQuantity = qtyToDeduct,
                    RemainingStock = med.StockQuantity,
                    UnitPrice = med.UnitPrice,
                    Total = qtyToDeduct * med.UnitPrice
                });
            }
        }

        if (request.PrescriptionId.HasValue)
        {
            var rx = await _context.Prescriptions.FirstOrDefaultAsync(p => p.Id == request.PrescriptionId.Value);
            if (rx != null)
            {
                rx.Status = "Dispensed";
            }
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "Medicines dispensed successfully.",
            data = dispensedItems
        });
    }
}

public class CreateMedicineRequest
{
    public string BrandName { get; set; } = string.Empty;
    public string GenericName { get; set; } = string.Empty;
    public string Manufacturer { get; set; } = string.Empty;
    public string? DosageForm { get; set; } = "Tablet";
    public string? Strength { get; set; } = "500mg";
    public decimal UnitPrice { get; set; }
    public int StockQuantity { get; set; } = 100;
    public int ReorderLevel { get; set; } = 50;
    public bool RequiresPrescription { get; set; } = true;
}

public class AdjustStockRequest
{
    public int QuantityDelta { get; set; }
}

public class DispenseRequest
{
    public Guid? PrescriptionId { get; set; }
    public List<DispenseItemDto> Items { get; set; } = new();
}

public class DispenseItemDto
{
    public Guid MedicineId { get; set; }
    public int Quantity { get; set; }
}

