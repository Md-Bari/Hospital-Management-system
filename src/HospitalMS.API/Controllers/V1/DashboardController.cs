using HospitalMS.API.Common;
using HospitalMS.Application.Common.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.API.Controllers.V1;

public class DashboardController : BaseApiController
{
    private static readonly string[] ChartColors = { "#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4" };

    private readonly IApplicationDbContext _context;

    public DashboardController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("stats")]
    public async Task<ActionResult> GetDashboardStats()
    {
        var today = ClinicDates.Today();
        var tomorrow = today.AddDays(1);

        var patientCount = await _context.Patients.CountAsync(p => !p.IsDeleted);
        var doctorCount = await _context.Doctors.CountAsync(d => !d.IsDeleted && d.IsActive);
        var availableDoctorCount = await _context.Doctors.CountAsync(d => !d.IsDeleted && d.IsActive && d.IsAvailable);
        var todayAppointments = await _context.Appointments
            .CountAsync(a => !a.IsDeleted && a.AppointmentDate >= today && a.AppointmentDate < tomorrow && a.Status != "Cancelled");
        var pendingLabOrders = await _context.LabOrders
            .CountAsync(o => !o.IsDeleted && o.Status != "Completed" && o.Status != "Cancelled");
        var lowStockMedicines = await _context.Medicines
            .CountAsync(m => !m.IsDeleted && m.IsActive && m.StockQuantity <= m.ReorderLevel);

        return Ok(new
        {
            success = true,
            data = new
            {
                patients = new { count = patientCount, label = "Patients" },
                doctors = new { count = doctorCount, label = "Doctors", detail = $"{availableDoctorCount} on duty" },
                todayAppointments = new { count = todayAppointments, label = "Today's Appointments" },
                pendingLabOrders = new { count = pendingLabOrders, label = "Pending Lab Orders" },
                lowStockMedicines = new { count = lowStockMedicines, label = "Low Stock Medicines" }
            }
        });
    }

    /// <summary>Appointments per day over the last 7 days, split by patient group.</summary>
    [HttpGet("trends")]
    public async Task<ActionResult> GetTrends()
    {
        var today = ClinicDates.Today();
        var from = today.AddDays(-6);
        var to = today.AddDays(1);

        var visits = await _context.Appointments
            .Where(a => !a.IsDeleted && a.Status != "Cancelled" && a.AppointmentDate >= from && a.AppointmentDate < to)
            .Select(a => new { a.AppointmentDate, a.Patient.Gender, a.Patient.DateOfBirth })
            .AsNoTracking()
            .ToListAsync();

        var trends = Enumerable.Range(0, 7)
            .Select(offset => from.AddDays(offset))
            .Select(day =>
            {
                var dayVisits = visits.Where(v => v.AppointmentDate.Date == day.Date).ToList();
                var children = dayVisits.Where(v => ClinicDates.AgeOn(v.DateOfBirth, day) < 18).ToList();
                var adults = dayVisits.Except(children).ToList();
                return new
                {
                    date = day.ToString("dd MMM"),
                    male = adults.Count(v => v.Gender == "Male"),
                    female = adults.Count(v => v.Gender == "Female"),
                    children = children.Count,
                    other = adults.Count(v => v.Gender != "Male" && v.Gender != "Female")
                };
            })
            .ToList();

        return Ok(new { success = true, period = "Last 7 days", data = trends });
    }

    /// <summary>Appointment volume by department for today, this week, or this month.</summary>
    [HttpGet("department-stats")]
    public async Task<ActionResult> GetDepartmentStats([FromQuery] string timeFilter = "Today")
    {
        var today = ClinicDates.Today();
        var from = timeFilter switch
        {
            "This Week" => today.AddDays(-6),
            "This Month" => new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc),
            _ => today
        };
        var to = today.AddDays(1);

        var byDepartment = await _context.Appointments
            .Where(a => !a.IsDeleted && a.Status != "Cancelled" && a.AppointmentDate >= from && a.AppointmentDate < to)
            .GroupBy(a => a.Doctor.Department.Name)
            .Select(g => new { name = g.Key, value = g.Count() })
            .OrderByDescending(g => g.value)
            .AsNoTracking()
            .ToListAsync();

        var departments = byDepartment
            .Take(ChartColors.Length)
            .Select((d, i) => new { d.name, d.value, color = ChartColors[i] })
            .ToList();

        return Ok(new
        {
            success = true,
            timeFilter,
            data = new
            {
                total = byDepartment.Sum(d => d.value),
                departments
            }
        });
    }

    [HttpGet("schedule")]
    public async Task<ActionResult> GetDoctorSchedule()
    {
        var weekday = ClinicDates.Today().DayOfWeek;

        var doctors = await _context.Doctors
            .Where(d => !d.IsDeleted && d.IsActive)
            .OrderByDescending(d => d.IsAvailable)
            .ThenBy(d => d.FullName)
            .Take(5)
            .Select(d => new
            {
                id = d.Id,
                name = d.FullName,
                department = d.Department.Name,
                specialization = d.Specialization,
                avatarUrl = d.AvatarUrl,
                isAvailable = d.IsAvailable,
                todaySchedule = d.Schedules
                    .Where(s => s.IsActive && s.DayOfWeek == weekday)
                    .Select(s => new { s.StartTime, s.EndTime })
                    .FirstOrDefault()
            })
            .AsNoTracking()
            .ToListAsync();

        var result = doctors.Select(d => new
        {
            d.id,
            d.name,
            d.department,
            d.specialization,
            d.avatarUrl,
            d.isAvailable,
            timeSlot = d.todaySchedule == null
                ? "No chamber today"
                : $"{DateTime.Today.Add(d.todaySchedule.StartTime):hh:mm tt} - {DateTime.Today.Add(d.todaySchedule.EndTime):hh:mm tt}"
        });

        return Ok(new { success = true, data = result });
    }

    /// <summary>Operational alerts derived from live data: stock, overdue invoices, urgent labs.</summary>
    [HttpGet("alerts")]
    public async Task<ActionResult> GetOperationalAlerts()
    {
        var alerts = new List<object>();

        var lowStock = await _context.Medicines
            .Where(m => !m.IsDeleted && m.IsActive && m.StockQuantity <= m.ReorderLevel)
            .OrderBy(m => m.StockQuantity)
            .Take(3)
            .Select(m => new { m.Id, m.BrandName, m.StockQuantity, m.ReorderLevel })
            .AsNoTracking()
            .ToListAsync();

        foreach (var m in lowStock)
        {
            alerts.Add(new
            {
                id = $"stock-{m.Id}",
                title = m.StockQuantity == 0 ? $"{m.BrandName} is out of stock" : $"{m.BrandName} low: {m.StockQuantity} left",
                time = $"Reorder level {m.ReorderLevel}",
                type = "stock",
                urgency = m.StockQuantity == 0 ? "high" : "medium",
                href = "/pharmacy"
            });
        }

        var urgentLabs = await _context.LabOrders
            .Where(o => !o.IsDeleted && o.Status != "Completed" && o.Status != "Cancelled" && o.Priority != "Routine")
            .OrderBy(o => o.CreatedAt)
            .Take(3)
            .Select(o => new { o.Id, o.OrderNumber, o.Priority, PatientName = o.Patient.FirstName + " " + o.Patient.LastName })
            .AsNoTracking()
            .ToListAsync();

        foreach (var o in urgentLabs)
        {
            alerts.Add(new
            {
                id = $"lab-{o.Id}",
                title = $"{o.Priority} lab order {o.OrderNumber} pending",
                time = o.PatientName,
                type = "lab",
                urgency = o.Priority == "STAT" ? "high" : "medium",
                href = "/laboratory"
            });
        }

        var unpaidCount = await _context.Invoices.CountAsync(i => !i.IsDeleted && (i.Status == "Unpaid" || i.Status == "PartiallyPaid"));
        if (unpaidCount > 0)
        {
            var dueTotal = await _context.Invoices
                .Where(i => !i.IsDeleted && (i.Status == "Unpaid" || i.Status == "PartiallyPaid"))
                .SumAsync(i => i.TotalAmount - i.PaidAmount);

            alerts.Add(new
            {
                id = "billing-due",
                title = $"{unpaidCount} invoice(s) awaiting payment",
                time = $"৳{dueTotal:N0} outstanding",
                type = "billing",
                urgency = "low",
                href = "/billing"
            });
        }

        return Ok(new { success = true, data = alerts });
    }
}
