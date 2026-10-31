using HospitalMS.API.Common;
using HospitalMS.Application.Common.Interfaces;
using HospitalMS.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.API.Controllers.V1;

public class PatientsController : BaseApiController
{
    private readonly IApplicationDbContext _context;

    public PatientsController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult> GetPatients(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? gender = null,
        [FromQuery] string? bloodGroup = null)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);

        var query = _context.Patients
            .Where(p => !p.IsDeleted)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim().ToLower();
            query = query.Where(p =>
                p.FirstName.ToLower().Contains(search) ||
                p.LastName.ToLower().Contains(search) ||
                p.PatientUid.ToLower().Contains(search) ||
                p.Phone.Contains(search) ||
                (p.NationalId != null && p.NationalId.Contains(search)) ||
                (p.Email != null && p.Email.ToLower().Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(gender) && gender != "All")
        {
            query = query.Where(p => p.Gender.ToLower() == gender.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(bloodGroup) && bloodGroup != "All")
        {
            query = query.Where(p => p.BloodGroup.ToLower() == bloodGroup.ToLower());
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new
            {
                p.Id,
                p.PatientUid,
                p.FirstName,
                p.LastName,
                FullName = p.FirstName + " " + p.LastName,
                p.DateOfBirth,
                Age = ClinicDates.Age(p.DateOfBirth),
                p.Gender,
                p.BloodGroup,
                p.Phone,
                p.Email,
                p.Address,
                p.EmergencyContactName,
                p.EmergencyContactPhone,
                p.KnownAllergies,
                p.ChronicConditions,
                p.IsActive,
                p.CreatedAt
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
    public async Task<ActionResult> GetPatientById(Guid id)
    {
        var patient = await _context.Patients
            .Include(p => p.Appointments.OrderByDescending(a => a.AppointmentDate).Take(10))
                .ThenInclude(a => a.Doctor)
            .Include(p => p.Encounters.OrderByDescending(e => e.EncounterDateTime).Take(5))
            .Include(p => p.Prescriptions.OrderByDescending(pr => pr.CreatedAt).Take(5))
                .ThenInclude(pr => pr.Medicines)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);

        if (patient == null)
            return NotFound(new { success = false, error = "Patient not found." });

        return Ok(new
        {
            success = true,
            data = new
            {
                patient.Id,
                patient.PatientUid,
                patient.FirstName,
                patient.LastName,
                FullName = patient.FirstName + " " + patient.LastName,
                patient.DateOfBirth,
                Age = ClinicDates.Age(patient.DateOfBirth),
                patient.Gender,
                patient.BloodGroup,
                patient.NationalId,
                patient.Phone,
                patient.Email,
                patient.Address,
                patient.MaritalStatus,
                patient.EmergencyContactName,
                patient.EmergencyContactPhone,
                patient.KnownAllergies,
                patient.ChronicConditions,
                patient.IsActive,
                patient.CreatedAt,
                RecentAppointments = patient.Appointments.Select(a => new
                {
                    a.Id,
                    a.AppointmentNumber,
                    a.AppointmentDate,
                    a.SlotStartTime,
                    a.Status,
                    a.QueueSerialNumber,
                    DoctorName = a.Doctor.FullName,
                    DoctorSpecialization = a.Doctor.Specialization
                }),
                RecentEncounters = patient.Encounters.Select(e => new
                {
                    e.Id,
                    e.EncounterNumber,
                    e.EncounterDateTime,
                    e.ChiefComplaints,
                    e.Diagnosis,
                    e.Status
                }),
                RecentPrescriptions = patient.Prescriptions.Select(pr => new
                {
                    pr.Id,
                    pr.PrescriptionNumber,
                    pr.CreatedAt,
                    pr.Status,
                    MedicineCount = pr.Medicines.Count
                })
            }
        });
    }

    [HttpPost]
    public async Task<ActionResult> CreatePatient([FromBody] CreatePatientRequest request)
    {
        var validationError = ValidatePatientRequest(request);
        if (validationError != null)
            return BadRequest(new { success = false, error = validationError });

        // Generate Patient UID: DCH-YYYYMM-XXXX. Soft-deleted patients still hold their UID (unique index).
        var currentPrefix = $"DCH-{DateTime.UtcNow:yyyyMM}-";
        var countThisMonth = await _context.Patients.IgnoreQueryFilters().CountAsync(p => p.PatientUid.StartsWith(currentPrefix));
        var patientUid = $"{currentPrefix}{(countThisMonth + 1):D4}";

        var patient = new Patient
        {
            PatientUid = patientUid,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            DateOfBirth = ClinicDates.AsUtcDate(request.DateOfBirth ?? DateTime.UtcNow.AddYears(-30)),
            Gender = request.Gender ?? "Other",
            BloodGroup = request.BloodGroup ?? "Unknown",
            NationalId = request.NationalId?.Trim(),
            Phone = request.Phone.Trim(),
            Email = request.Email?.Trim(),
            Address = request.Address?.Trim() ?? "Dhaka, Bangladesh",
            EmergencyContactName = request.EmergencyContactName?.Trim(),
            EmergencyContactPhone = request.EmergencyContactPhone?.Trim(),
            MaritalStatus = request.MaritalStatus ?? "Single",
            KnownAllergies = request.KnownAllergies,
            ChronicConditions = request.ChronicConditions,
            IsActive = true
        };

        _context.Patients.Add(patient);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPatientById), new { id = patient.Id }, new
        {
            success = true,
            data = new
            {
                patient.Id,
                patient.PatientUid,
                FullName = patient.FullName,
                patient.Phone,
                patient.BloodGroup
            }
        });
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult> UpdatePatient(Guid id, [FromBody] UpdatePatientRequest request)
    {
        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
        if (patient == null)
            return NotFound(new { success = false, error = "Patient not found." });

        var validationError = ValidatePatientRequest(request);
        if (validationError != null)
            return BadRequest(new { success = false, error = validationError });

        patient.FirstName = request.FirstName.Trim();
        patient.LastName = request.LastName.Trim();
        if (request.DateOfBirth.HasValue) patient.DateOfBirth = ClinicDates.AsUtcDate(request.DateOfBirth.Value);
        if (!string.IsNullOrWhiteSpace(request.Gender)) patient.Gender = request.Gender;
        if (!string.IsNullOrWhiteSpace(request.BloodGroup)) patient.BloodGroup = request.BloodGroup;
        patient.NationalId = request.NationalId?.Trim();
        patient.Phone = request.Phone.Trim();
        patient.Email = request.Email?.Trim();
        patient.Address = request.Address?.Trim() ?? patient.Address;
        patient.EmergencyContactName = request.EmergencyContactName?.Trim();
        patient.EmergencyContactPhone = request.EmergencyContactPhone?.Trim();
        if (!string.IsNullOrWhiteSpace(request.MaritalStatus)) patient.MaritalStatus = request.MaritalStatus;
        patient.KnownAllergies = request.KnownAllergies;
        patient.ChronicConditions = request.ChronicConditions;
        patient.IsActive = request.IsActive;

        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = new { patient.Id, patient.PatientUid, FullName = patient.FullName } });
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeletePatient(Guid id)
    {
        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
        if (patient == null)
            return NotFound(new { success = false, error = "Patient not found." });

        patient.IsDeleted = true;
        patient.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Patient deactivated successfully." });
    }

    private static string? ValidatePatientRequest(CreatePatientRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName) || string.IsNullOrWhiteSpace(request.Phone))
            return "First name, last name, and phone are required.";

        if (request.Phone.Trim().Length > 20)
            return "Phone number cannot exceed 20 characters.";

        if (request.DateOfBirth.HasValue && ClinicDates.AsUtcDate(request.DateOfBirth.Value) > ClinicDates.Today())
            return "Date of birth cannot be in the future.";

        return null;
    }
}

public class CreatePatientRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? BloodGroup { get; set; }
    public string? NationalId { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? MaritalStatus { get; set; }
    public string? KnownAllergies { get; set; }
    public string? ChronicConditions { get; set; }
}

public class UpdatePatientRequest : CreatePatientRequest
{
    public bool IsActive { get; set; } = true;
}

