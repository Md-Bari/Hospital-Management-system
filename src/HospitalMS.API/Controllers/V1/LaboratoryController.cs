using HospitalMS.Application.Common.Interfaces;
using HospitalMS.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.API.Controllers.V1;

public class LaboratoryController : BaseApiController
{
    private readonly IApplicationDbContext _context;

    public LaboratoryController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("tests")]
    public async Task<ActionResult> GetTests(
        [FromQuery] string? category = null,
        [FromQuery] string? search = null)
    {
        var query = _context.LabTests
            .Where(t => t.IsActive)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(category) && category != "All")
        {
            query = query.Where(t => t.Category.ToLower() == category.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim().ToLower();
            query = query.Where(t => t.Name.ToLower().Contains(search) || t.Code.ToLower().Contains(search));
        }

        var tests = await query
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
                PriceDisplay = $"৳{t.Price:N0}",
                t.TurnaroundHours,
                t.ReferenceRange
            })
            .ToListAsync();

        return Ok(new { success = true, data = tests });
    }

    [HttpGet("orders")]
    public async Task<ActionResult> GetOrders(
        [FromQuery] Guid? patientId = null,
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15)
    {
        var query = _context.LabOrders
            .Include(o => o.Patient)
            .Include(o => o.Doctor)
            .Include(o => o.Items)
            .Where(o => !o.IsDeleted)
            .AsNoTracking();

        if (patientId.HasValue)
            query = query.Where(o => o.PatientId == patientId.Value);

        if (!string.IsNullOrWhiteSpace(status) && status != "All")
            query = query.Where(o => o.Status.ToLower() == status.ToLower());

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new
            {
                o.Id,
                o.OrderNumber,
                o.CreatedAt,
                o.Priority,
                o.Status,
                o.TotalAmount,
                TotalAmountDisplay = $"৳{o.TotalAmount:N0}",
                o.IsPaid,
                Patient = new
                {
                    o.Patient.Id,
                    o.Patient.PatientUid,
                    FullName = o.Patient.FirstName + " " + o.Patient.LastName
                },
                DoctorName = o.Doctor != null ? o.Doctor.FullName : null,
                ItemCount = o.Items.Count,
                Tests = o.Items.Select(i => i.TestName)
            })
            .ToListAsync();

        return Ok(new { success = true, data = new { items, totalCount, page, pageSize } });
    }

    [HttpGet("orders/{id:guid}")]
    public async Task<ActionResult> GetOrderById(Guid id)
    {
        var order = await _context.LabOrders
            .Include(o => o.Patient)
            .Include(o => o.Doctor)
            .Include(o => o.Items)
                .ThenInclude(i => i.LabTest)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == id && !o.IsDeleted);

        if (order == null)
            return NotFound(new { success = false, error = "Lab order not found." });

        return Ok(new
        {
            success = true,
            data = new
            {
                order.Id,
                order.OrderNumber,
                order.CreatedAt,
                order.Priority,
                order.Status,
                order.TotalAmount,
                TotalAmountDisplay = $"৳{order.TotalAmount:N0}",
                order.IsPaid,
                Patient = new
                {
                    order.Patient.Id,
                    order.Patient.PatientUid,
                    FullName = order.Patient.FirstName + " " + order.Patient.LastName,
                    Age = DateTime.UtcNow.Year - order.Patient.DateOfBirth.Year,
                    order.Patient.Gender,
                    order.Patient.BloodGroup
                },
                Doctor = order.Doctor == null ? null : new
                {
                    order.Doctor.Id,
                    order.Doctor.FullName,
                    order.Doctor.Specialization
                },
                Items = order.Items.Select(i => new
                {
                    i.Id,
                    i.LabTestId,
                    i.TestName,
                    i.UnitPrice,
                    UnitPriceDisplay = $"৳{i.UnitPrice:N0}",
                    i.ResultValue,
                    i.ReferenceRange,
                    i.IsAbnormal
                })
            }
        });
    }

    [HttpPost("orders")]
    public async Task<ActionResult> CreateOrder([FromBody] CreateLabOrderRequest request)
    {
        if (request.TestIds == null || request.TestIds.Count == 0)
            return BadRequest(new { success = false, error = "At least one test must be selected." });

        var selectedTests = await _context.LabTests
            .Where(t => request.TestIds.Contains(t.Id) && t.IsActive)
            .ToListAsync();

        if (selectedTests.Count == 0)
            return BadRequest(new { success = false, error = "Invalid tests selected." });

        var count = await _context.LabOrders.CountAsync();
        var orderNumber = $"LAB-{DateTime.UtcNow:yyyyMMdd}-{(count + 1):D4}";
        var totalAmount = selectedTests.Sum(t => t.Price);

        var order = new LabOrder
        {
            OrderNumber = orderNumber,
            PatientId = request.PatientId,
            DoctorId = request.DoctorId,
            Priority = request.Priority ?? "Routine",
            Status = "Pending",
            TotalAmount = totalAmount,
            IsPaid = request.IsPaid,
            Items = selectedTests.Select(t => new LabOrderItem
            {
                LabTestId = t.Id,
                TestName = t.Name,
                UnitPrice = t.Price,
                ReferenceRange = t.ReferenceRange
            }).ToList()
        };

        _context.LabOrders.Add(order);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetOrderById), new { id = order.Id }, new
        {
            success = true,
            data = new { order.Id, order.OrderNumber, order.TotalAmount, TotalAmountDisplay = $"৳{order.TotalAmount:N0}" }
        });
    }

    [HttpPut("orders/{id:guid}/results")]
    public async Task<ActionResult> UpdateOrderResults(Guid id, [FromBody] UpdateLabResultsRequest request)
    {
        var order = await _context.LabOrders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id && !o.IsDeleted);

        if (order == null)
            return NotFound(new { success = false, error = "Lab order not found." });

        foreach (var res in request.Results)
        {
            var item = order.Items.FirstOrDefault(i => i.Id == res.ItemId);
            if (item != null)
            {
                item.ResultValue = res.ResultValue;
                item.IsAbnormal = res.IsAbnormal;
            }
        }

        order.Status = "Completed";
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Test results updated successfully." });
    }
}

public class CreateLabOrderRequest
{
    public Guid PatientId { get; set; }
    public Guid? DoctorId { get; set; }
    public string? Priority { get; set; } = "Routine";
    public bool IsPaid { get; set; } = false;
    public List<Guid> TestIds { get; set; } = new();
}

public class UpdateLabResultsRequest
{
    public List<LabResultItemDto> Results { get; set; } = new();
}

public class LabResultItemDto
{
    public Guid ItemId { get; set; }
    public string ResultValue { get; set; } = string.Empty;
    public bool IsAbnormal { get; set; }
}

