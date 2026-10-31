using HospitalMS.Application.Common.Interfaces;
using HospitalMS.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.API.Controllers.V1;

public class AppointmentsController : BaseApiController
{
    private readonly IApplicationDbContext _context;

    public AppointmentsController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult> GetAppointments(
        [FromQuery] DateTime? date = null,
        [FromQuery] Guid? doctorId = null,
        [FromQuery] Guid? patientId = null,
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15)
    {
        var query = _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
                .ThenInclude(d => d.Department)
            .Where(a => !a.IsDeleted)
            .AsNoTracking();

        if (date.HasValue)
        {
            var d = date.Value.Date;
            query = query.Where(a => a.AppointmentDate.Date == d);
        }

        if (doctorId.HasValue)
        {
            query = query.Where(a => a.DoctorId == doctorId.Value);
        }

        if (patientId.HasValue)
        {
            query = query.Where(a => a.PatientId == patientId.Value);
        }

        if (!string.IsNullOrWhiteSpace(status) && status != "All")
        {
            query = query.Where(a => a.Status.ToLower() == status.ToLower());
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(a => a.AppointmentDate)
            .ThenBy(a => a.QueueSerialNumber)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new
            {
                a.Id,
                a.AppointmentNumber,
                a.AppointmentDate,
                TimeSlot = $"{a.SlotStartTime:hh\\:mm} - {a.SlotEndTime:hh\\:mm}",
                a.QueueSerialNumber,
                a.AppointmentType,
                a.Status,
                a.FeeAmount,
                FeeAmountDisplay = $"৳{a.FeeAmount:N0}",
                a.IsPaid,
                a.Reason,
                Patient = new
                {
                    a.Patient.Id,
                    a.Patient.PatientUid,
                    FullName = a.Patient.FirstName + " " + a.Patient.LastName,
                    a.Patient.Phone,
                    a.Patient.BloodGroup,
                    a.Patient.Gender
                },
                Doctor = new
                {
                    a.Doctor.Id,
                    a.Doctor.FullName,
                    a.Doctor.Specialization,
                    Department = a.Doctor.Department.Name,
                    a.Doctor.RoomNumber
                }
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

    [HttpGet("{id:guid}")]
    public async Task<ActionResult> GetAppointmentById(Guid id)
    {
        var appt = await _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
                .ThenInclude(d => d.Department)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);

        if (appt == null)
            return NotFound(new { success = false, error = "Appointment not found." });

        return Ok(new
        {
            success = true,
            data = new
            {
                appt.Id,
                appt.AppointmentNumber,
                appt.AppointmentDate,
                TimeSlot = $"{appt.SlotStartTime:hh\\:mm} - {appt.SlotEndTime:hh\\:mm}",
                appt.QueueSerialNumber,
                appt.AppointmentType,
                appt.Status,
                appt.FeeAmount,
                FeeAmountDisplay = $"৳{appt.FeeAmount:N0}",
                appt.IsPaid,
                appt.Reason,
                Patient = new
                {
                    appt.Patient.Id,
                    appt.Patient.PatientUid,
                    FullName = appt.Patient.FirstName + " " + appt.Patient.LastName,
                    appt.Patient.Phone,
                    appt.Patient.BloodGroup,
                    appt.Patient.Gender
                },
                Doctor = new
                {
                    appt.Doctor.Id,
                    appt.Doctor.FullName,
                    appt.Doctor.Specialization,
                    Department = appt.Doctor.Department.Name,
                    appt.Doctor.RoomNumber
                }
            }
        });
    }

    [HttpPost]
    public async Task<ActionResult> CreateAppointment([FromBody] CreateAppointmentRequest request)
    {
        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.Id == request.PatientId && !p.IsDeleted);
        if (patient == null)
            return BadRequest(new { success = false, error = "Patient not found." });

        var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.Id == request.DoctorId && !d.IsDeleted);
        if (doctor == null)
            return BadRequest(new { success = false, error = "Doctor not found." });

        var apptDate = request.AppointmentDate.Date;

        // Calculate next queue serial number for this doctor on this day
        var existingCount = await _context.Appointments
            .CountAsync(a => a.DoctorId == request.DoctorId && a.AppointmentDate.Date == apptDate && !a.IsDeleted);

        var queueSerial = existingCount + 1;
        var apptNumber = $"APT-{apptDate:yyyyMMdd}-{queueSerial:D3}";

        var startTime = request.SlotStartTime ?? new TimeSpan(9, 0, 0).Add(TimeSpan.FromMinutes((queueSerial - 1) * 15));
        var endTime = startTime.Add(TimeSpan.FromMinutes(15));

        var appointment = new Appointment
        {
            AppointmentNumber = apptNumber,
            PatientId = request.PatientId,
            DoctorId = request.DoctorId,
            AppointmentDate = apptDate,
            SlotStartTime = startTime,
            SlotEndTime = endTime,
            AppointmentType = request.AppointmentType ?? "InPerson",
            Status = "Confirmed",
            QueueSerialNumber = queueSerial,
            FeeAmount = doctor.ConsultationFee,
            IsPaid = request.IsPaid,
            Reason = request.Reason?.Trim()
        };

        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAppointmentById), new { id = appointment.Id }, new
        {
            success = true,
            data = new
            {
                appointment.Id,
                appointment.AppointmentNumber,
                appointment.AppointmentDate,
                appointment.QueueSerialNumber,
                appointment.FeeAmount,
                FeeAmountDisplay = $"৳{appointment.FeeAmount:N0}",
                appointment.Status,
                PatientName = patient.FullName,
                DoctorName = doctor.FullName
            }
        });
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult> UpdateAppointmentStatus(Guid id, [FromBody] UpdateStatusRequest request)
    {
        var appointment = await _context.Appointments.FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);
        if (appointment == null)
            return NotFound(new { success = false, error = "Appointment not found." });

        appointment.Status = request.Status;
        if (request.Status == "Cancelled" && !string.IsNullOrWhiteSpace(request.Reason))
        {
            appointment.CancellationReason = request.Reason;
        }

        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = new { appointment.Id, appointment.Status } });
    }

    [HttpGet("queue/today")]
    public async Task<ActionResult> GetTodayQueue([FromQuery] Guid? doctorId = null)
    {
        var today = DateTime.UtcNow.Date;
        var query = _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
            .Where(a => a.AppointmentDate.Date == today && !a.IsDeleted);

        if (doctorId.HasValue)
        {
            query = query.Where(a => a.DoctorId == doctorId.Value);
        }

        var queue = await query
            .OrderBy(a => a.QueueSerialNumber)
            .Select(a => new
            {
                a.Id,
                a.AppointmentNumber,
                a.QueueSerialNumber,
                Time = $"{a.SlotStartTime:hh\\:mm}",
                a.Status,
                PatientName = a.Patient.FirstName + " " + a.Patient.LastName,
                PatientUid = a.Patient.PatientUid,
                DoctorName = a.Doctor.FullName,
                DoctorSpecialization = a.Doctor.Specialization,
                RoomNumber = a.Doctor.RoomNumber
            })
            .ToListAsync();

        var currentServing = queue.FirstOrDefault(q => q.Status == "InConsultation");
        var nextInLine = queue.FirstOrDefault(q => q.Status == "CheckedIn" || q.Status == "Confirmed");
        var totalScheduled = queue.Count;
        var completedCount = queue.Count(q => q.Status == "Completed");

        return Ok(new
        {
            success = true,
            data = new
            {
                today = today.ToString("yyyy-MM-dd"),
                totalScheduled,
                completedCount,
                currentServing,
                nextInLine,
                queue
            }
        });
    }
}

public class CreateAppointmentRequest
{
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public DateTime AppointmentDate { get; set; } = DateTime.UtcNow;
    public TimeSpan? SlotStartTime { get; set; }
    public string? AppointmentType { get; set; }
    public bool IsPaid { get; set; } = false;
    public string? Reason { get; set; }
}

public class UpdateStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public string? Reason { get; set; }
}

