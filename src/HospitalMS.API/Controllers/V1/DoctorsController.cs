using HospitalMS.Application.Common.Interfaces;
using HospitalMS.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.API.Controllers.V1;

public class DoctorsController : BaseApiController
{
    private readonly IApplicationDbContext _context;

    public DoctorsController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult> GetDoctors(
        [FromQuery] string? search = null,
        [FromQuery] string? department = null,
        [FromQuery] string? specialization = null,
        [FromQuery] bool? isAvailable = null)
    {
        var query = _context.Doctors
            .Include(d => d.Department)
            .Include(d => d.Schedules.Where(s => s.IsActive))
            .Where(d => !d.IsDeleted && d.IsActive)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim().ToLower();
            query = query.Where(d =>
                d.FullName.ToLower().Contains(search) ||
                d.Specialization.ToLower().Contains(search) ||
                d.Department.Name.ToLower().Contains(search) ||
                d.Qualifications.ToLower().Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(department) && department != "All")
        {
            query = query.Where(d => d.Department.Name.ToLower() == department.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(specialization) && specialization != "All")
        {
            query = query.Where(d => d.Specialization.ToLower() == specialization.ToLower());
        }

        if (isAvailable.HasValue)
        {
            query = query.Where(d => d.IsAvailable == isAvailable.Value);
        }

        var doctors = await query
            .OrderBy(d => d.FullName)
            .Select(d => new
            {
                d.Id,
                d.FullName,
                d.LicenseNumber,
                d.Specialization,
                d.Qualifications,
                DepartmentId = d.DepartmentId,
                DepartmentName = d.Department.Name,
                d.ConsultationFee,
                ConsultationFeeDisplay = $"৳{d.ConsultationFee:N0}",
                d.FollowUpDays,
                d.RoomNumber,
                d.Phone,
                d.Email,
                d.AvatarUrl,
                d.IsAvailable,
                d.IsAvailableTelemedicine,
                Schedules = d.Schedules.Select(s => new
                {
                    s.Id,
                    Day = s.DayOfWeek.ToString(),
                    DayOfWeek = (int)s.DayOfWeek,
                    StartTime = s.StartTime.ToString(@"hh\:mm"),
                    EndTime = s.EndTime.ToString(@"hh\:mm"),
                    TimeDisplay = $"{s.StartTime:hh\\:mm} - {s.EndTime:hh\\:mm}",
                    s.MaxPatients,
                    s.SlotDurationMinutes
                })
            })
            .ToListAsync();

        return Ok(new { success = true, data = doctors });
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult> GetDoctorById(Guid id)
    {
        var doctor = await _context.Doctors
            .Include(d => d.Department)
            .Include(d => d.Schedules)
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == id && !d.IsDeleted);

        if (doctor == null)
            return NotFound(new { success = false, error = "Doctor not found." });

        return Ok(new
        {
            success = true,
            data = new
            {
                doctor.Id,
                doctor.FullName,
                doctor.LicenseNumber,
                doctor.Specialization,
                doctor.Qualifications,
                Department = new
                {
                    doctor.Department.Id,
                    doctor.Department.Name,
                    doctor.Department.Code
                },
                doctor.ConsultationFee,
                ConsultationFeeDisplay = $"৳{doctor.ConsultationFee:N0}",
                doctor.FollowUpDays,
                doctor.RoomNumber,
                doctor.Phone,
                doctor.Email,
                doctor.AvatarUrl,
                doctor.IsAvailable,
                doctor.IsAvailableTelemedicine,
                Schedules = doctor.Schedules.Where(s => s.IsActive).Select(s => new
                {
                    s.Id,
                    Day = s.DayOfWeek.ToString(),
                    DayOfWeek = (int)s.DayOfWeek,
                    StartTime = s.StartTime.ToString(@"hh\:mm"),
                    EndTime = s.EndTime.ToString(@"hh\:mm"),
                    TimeDisplay = $"{s.StartTime:hh\\:mm} - {s.EndTime:hh\\:mm}",
                    s.MaxPatients,
                    s.SlotDurationMinutes
                })
            }
        });
    }

    [HttpGet("specialties")]
    public async Task<ActionResult> GetSpecialties()
    {
        var specialties = await _context.Doctors
            .Where(d => !d.IsDeleted && d.IsActive)
            .Select(d => d.Specialization)
            .Distinct()
            .OrderBy(s => s)
            .ToListAsync();

        var departments = await _context.Departments
            .Where(dep => dep.IsActive)
            .Select(dep => new { dep.Id, dep.Name, dep.Code })
            .ToListAsync();

        return Ok(new
        {
            success = true,
            data = new
            {
                specialties,
                departments
            }
        });
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult> ToggleDoctorStatus(Guid id, [FromBody] ToggleStatusRequest request)
    {
        var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.Id == id && !d.IsDeleted);
        if (doctor == null)
            return NotFound(new { success = false, error = "Doctor not found." });

        doctor.IsAvailable = request.IsAvailable;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, data = new { doctor.Id, doctor.FullName, doctor.IsAvailable } });
    }

    [HttpPost]
    public async Task<ActionResult> CreateDoctor([FromBody] CreateDoctorRequest request)
    {
        var department = await _context.Departments.FirstOrDefaultAsync(d => d.Id == request.DepartmentId);
        if (department == null)
            return BadRequest(new { success = false, error = "Invalid Department ID." });

        var doctor = new Doctor
        {
            FullName = request.FullName.Trim(),
            LicenseNumber = request.LicenseNumber.Trim(),
            Specialization = request.Specialization.Trim(),
            Qualifications = request.Qualifications.Trim(),
            DepartmentId = request.DepartmentId,
            ConsultationFee = request.ConsultationFee,
            FollowUpDays = request.FollowUpDays,
            RoomNumber = request.RoomNumber?.Trim(),
            Phone = request.Phone?.Trim(),
            Email = request.Email?.Trim(),
            AvatarUrl = request.AvatarUrl,
            IsAvailable = true,
            IsAvailableTelemedicine = request.IsAvailableTelemedicine
        };

        _context.Doctors.Add(doctor);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetDoctorById), new { id = doctor.Id }, new { success = true, data = doctor });
    }
}

public class ToggleStatusRequest
{
    public bool IsAvailable { get; set; }
}

public class CreateDoctorRequest
{
    public string FullName { get; set; } = string.Empty;
    public string LicenseNumber { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public string Qualifications { get; set; } = string.Empty;
    public Guid DepartmentId { get; set; }
    public decimal ConsultationFee { get; set; } = 800;
    public int FollowUpDays { get; set; } = 7;
    public string? RoomNumber { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? AvatarUrl { get; set; }
    public bool IsAvailableTelemedicine { get; set; } = false;
}

