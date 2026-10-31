using HospitalMS.API.Common;
using HospitalMS.Application.Common.Interfaces;
using HospitalMS.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.API.Controllers.V1;

public class AppointmentsController : BaseApiController
{
    private static readonly string[] AllowedStatuses =
        { "Scheduled", "Confirmed", "CheckedIn", "InConsultation", "Completed", "Cancelled", "NoShow" };

    private static readonly string[] TerminalStatuses = { "Completed", "Cancelled", "NoShow" };

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
        (page, pageSize) = NormalizePaging(page, pageSize);

        var query = _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
                .ThenInclude(d => d.Department)
            .Where(a => !a.IsDeleted)
            .AsNoTracking();

        if (date.HasValue)
        {
            var dayStart = ClinicDates.AsUtcDate(date.Value);
            var dayEnd = dayStart.AddDays(1);
            query = query.Where(a => a.AppointmentDate >= dayStart && a.AppointmentDate < dayEnd);
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

        var apptDate = ClinicDates.AsUtcDate(request.AppointmentDate);
        if (apptDate < ClinicDates.Today())
            return BadRequest(new { success = false, error = "Appointment date cannot be in the past." });

        var nextDay = apptDate.AddDays(1);

        // Queue serial is per doctor per day; cancelled/no-show bookings keep their serial.
        var lastSerial = await _context.Appointments
            .IgnoreQueryFilters()
            .Where(a => a.DoctorId == request.DoctorId && a.AppointmentDate >= apptDate && a.AppointmentDate < nextDay)
            .MaxAsync(a => (int?)a.QueueSerialNumber) ?? 0;
        var queueSerial = lastSerial + 1;

        // Appointment numbers are unique hospital-wide, so the sequence spans every doctor that day.
        var dayCount = await _context.Appointments
            .IgnoreQueryFilters()
            .CountAsync(a => a.AppointmentDate >= apptDate && a.AppointmentDate < nextDay);
        var apptNumber = $"APT-{apptDate:yyyyMMdd}-{(dayCount + 1):D3}";

        var schedule = await _context.DoctorSchedules
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.DoctorId == doctor.Id && s.IsActive && s.DayOfWeek == apptDate.DayOfWeek);

        if (schedule != null && queueSerial > schedule.MaxPatients)
            return BadRequest(new { success = false, error = $"{doctor.FullName} is fully booked on {apptDate:dd MMM yyyy} ({schedule.MaxPatients} patients max)." });

        var slotMinutes = schedule?.SlotDurationMinutes > 0 ? schedule.SlotDurationMinutes : 15;
        var dayStartTime = schedule?.StartTime ?? new TimeSpan(9, 0, 0);
        var startTime = request.SlotStartTime ?? dayStartTime.Add(TimeSpan.FromMinutes((queueSerial - 1) * slotMinutes));
        var endTime = startTime.Add(TimeSpan.FromMinutes(slotMinutes));

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

        var newStatus = AllowedStatuses.FirstOrDefault(s => string.Equals(s, request.Status?.Trim(), StringComparison.OrdinalIgnoreCase));
        if (newStatus == null)
            return BadRequest(new { success = false, error = $"Invalid status. Allowed values: {string.Join(", ", AllowedStatuses)}." });

        if (TerminalStatuses.Contains(appointment.Status) && appointment.Status != newStatus)
            return BadRequest(new { success = false, error = $"Appointment is already {appointment.Status} and cannot be changed." });

        appointment.Status = newStatus;
        if (newStatus == "Cancelled" && !string.IsNullOrWhiteSpace(request.Reason))
        {
            appointment.CancellationReason = request.Reason.Trim();
        }

        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = new { appointment.Id, appointment.Status } });
    }

    [HttpGet("queue/today")]
    public async Task<ActionResult> GetTodayQueue([FromQuery] Guid? doctorId = null)
    {
        var today = ClinicDates.Today();
        var tomorrow = today.AddDays(1);
        var query = _context.Appointments
            .Where(a => a.AppointmentDate >= today && a.AppointmentDate < tomorrow && !a.IsDeleted
                && a.Status != "Cancelled" && a.Status != "NoShow");

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
        // Patients who have physically checked in are called before those who have only booked.
        var nextInLine = queue.FirstOrDefault(q => q.Status == "CheckedIn")
            ?? queue.FirstOrDefault(q => q.Status == "Confirmed" || q.Status == "Scheduled");
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

