using HospitalMS.Application.Common.Interfaces;
using HospitalMS.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.API.Controllers.V1;

public class ClinicalController : BaseApiController
{
    private readonly IApplicationDbContext _context;

    public ClinicalController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("encounters")]
    public async Task<ActionResult> GetEncounters(
        [FromQuery] Guid? patientId = null,
        [FromQuery] Guid? doctorId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15)
    {
        var query = _context.ClinicalEncounters
            .Include(e => e.Patient)
            .Include(e => e.Doctor)
            .Include(e => e.Prescription)
            .Where(e => !e.IsDeleted)
            .AsNoTracking();

        if (patientId.HasValue)
            query = query.Where(e => e.PatientId == patientId.Value);

        if (doctorId.HasValue)
            query = query.Where(e => e.DoctorId == doctorId.Value);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(e => e.EncounterDateTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new
            {
                e.Id,
                e.EncounterNumber,
                e.EncounterDateTime,
                e.ChiefComplaints,
                e.Diagnosis,
                e.Status,
                Patient = new
                {
                    e.Patient.Id,
                    e.Patient.PatientUid,
                    FullName = e.Patient.FirstName + " " + e.Patient.LastName,
                    e.Patient.Gender,
                    Age = DateTime.UtcNow.Year - e.Patient.DateOfBirth.Year
                },
                Doctor = new
                {
                    e.Doctor.Id,
                    e.Doctor.FullName,
                    e.Doctor.Specialization
                },
                HasPrescription = e.Prescription != null
            })
            .ToListAsync();

        return Ok(new { success = true, data = new { items, totalCount, page, pageSize } });
    }

    [HttpGet("encounters/{id:guid}")]
    public async Task<ActionResult> GetEncounterById(Guid id)
    {
        var encounter = await _context.ClinicalEncounters
            .Include(e => e.Patient)
            .Include(e => e.Doctor)
            .Include(e => e.Prescription)
                .ThenInclude(p => p!.Medicines)
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);

        if (encounter == null)
            return NotFound(new { success = false, error = "Encounter not found." });

        return Ok(new
        {
            success = true,
            data = new
            {
                encounter.Id,
                encounter.EncounterNumber,
                encounter.EncounterDateTime,
                Vitals = new
                {
                    encounter.SystolicBp,
                    encounter.DiastolicBp,
                    BpDisplay = (encounter.SystolicBp.HasValue && encounter.DiastolicBp.HasValue) ? $"{encounter.SystolicBp:N0}/{encounter.DiastolicBp:N0} mmHg" : null,
                    encounter.PulseRate,
                    encounter.TemperatureCelsius,
                    encounter.Spo2Percentage,
                    encounter.WeightKg,
                    encounter.HeightCm
                },
                encounter.ChiefComplaints,
                encounter.HistoryOfPresentIllness,
                encounter.ExaminationFindings,
                encounter.Diagnosis,
                encounter.TreatmentPlan,
                encounter.FollowUpInstructions,
                encounter.Status,
                Patient = new
                {
                    encounter.Patient.Id,
                    encounter.Patient.PatientUid,
                    FullName = encounter.Patient.FirstName + " " + encounter.Patient.LastName,
                    encounter.Patient.Gender,
                    encounter.Patient.BloodGroup,
                    encounter.Patient.KnownAllergies
                },
                Doctor = new
                {
                    encounter.Doctor.Id,
                    encounter.Doctor.FullName,
                    encounter.Doctor.Specialization,
                    encounter.Doctor.LicenseNumber
                },
                Prescription = encounter.Prescription == null ? null : new
                {
                    encounter.Prescription.Id,
                    encounter.Prescription.PrescriptionNumber,
                    encounter.Prescription.DoctorNotes,
                    encounter.Prescription.LifestyleAdvice,
                    Medicines = encounter.Prescription.Medicines.Select(m => new
                    {
                        m.MedicineName,
                        m.GenericName,
                        m.Dosage,
                        m.Frequency,
                        m.DurationDays,
                        m.MealInstruction,
                        m.SpecialInstructions
                    })
                }
            }
        });
    }

    [HttpPost("encounters")]
    public async Task<ActionResult> CreateEncounter([FromBody] CreateEncounterRequest request)
    {
        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.Id == request.PatientId && !p.IsDeleted);
        if (patient == null)
            return BadRequest(new { success = false, error = "Patient not found." });

        var count = await _context.ClinicalEncounters.CountAsync();
        var encounterNumber = $"ENC-{DateTime.UtcNow:yyyyMMdd}-{(count + 1):D4}";

        var encounter = new ClinicalEncounter
        {
            EncounterNumber = encounterNumber,
            AppointmentId = request.AppointmentId,
            PatientId = request.PatientId,
            DoctorId = request.DoctorId,
            EncounterDateTime = DateTime.UtcNow,
            SystolicBp = request.SystolicBp,
            DiastolicBp = request.DiastolicBp,
            PulseRate = request.PulseRate,
            TemperatureCelsius = request.TemperatureCelsius,
            Spo2Percentage = request.Spo2Percentage,
            WeightKg = request.WeightKg,
            HeightCm = request.HeightCm,
            ChiefComplaints = request.ChiefComplaints,
            HistoryOfPresentIllness = request.HistoryOfPresentIllness,
            ExaminationFindings = request.ExaminationFindings,
            Diagnosis = request.Diagnosis,
            TreatmentPlan = request.TreatmentPlan,
            FollowUpInstructions = request.FollowUpInstructions,
            Status = "Completed",
            FinalizedAt = DateTime.UtcNow
        };

        _context.ClinicalEncounters.Add(encounter);

        // Update appointment status to Completed if linked
        if (request.AppointmentId.HasValue)
        {
            var appt = await _context.Appointments.FirstOrDefaultAsync(a => a.Id == request.AppointmentId.Value);
            if (appt != null)
            {
                appt.Status = "Completed";
            }
        }

        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetEncounterById), new { id = encounter.Id }, new
        {
            success = true,
            data = new { encounter.Id, encounter.EncounterNumber, encounter.Diagnosis }
        });
    }

    [HttpGet("prescriptions")]
    public async Task<ActionResult> GetPrescriptions(
        [FromQuery] Guid? patientId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15)
    {
        var query = _context.Prescriptions
            .Include(p => p.Patient)
            .Include(p => p.Doctor)
            .Include(p => p.Medicines)
            .Where(p => !p.IsDeleted)
            .AsNoTracking();

        if (patientId.HasValue)
            query = query.Where(p => p.PatientId == patientId.Value);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new
            {
                p.Id,
                p.PrescriptionNumber,
                p.CreatedAt,
                p.Status,
                p.FollowUpDate,
                Patient = new
                {
                    p.Patient.Id,
                    p.Patient.PatientUid,
                    FullName = p.Patient.FirstName + " " + p.Patient.LastName
                },
                Doctor = new
                {
                    p.Doctor.Id,
                    p.Doctor.FullName,
                    p.Doctor.Specialization
                },
                MedicineCount = p.Medicines.Count,
                MedicinesSummary = string.Join(", ", p.Medicines.Select(m => m.MedicineName))
            })
            .ToListAsync();

        return Ok(new { success = true, data = new { items, totalCount, page, pageSize } });
    }

    [HttpGet("prescriptions/{id:guid}")]
    public async Task<ActionResult> GetPrescriptionById(Guid id)
    {
        var prescription = await _context.Prescriptions
            .Include(p => p.Patient)
            .Include(p => p.Doctor)
                .ThenInclude(d => d.Department)
            .Include(p => p.Medicines)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);

        if (prescription == null)
            return NotFound(new { success = false, error = "Prescription not found." });

        return Ok(new
        {
            success = true,
            data = new
            {
                prescription.Id,
                prescription.PrescriptionNumber,
                prescription.CreatedAt,
                prescription.DoctorNotes,
                prescription.LifestyleAdvice,
                prescription.FollowUpDate,
                prescription.Status,
                Patient = new
                {
                    prescription.Patient.Id,
                    prescription.Patient.PatientUid,
                    FullName = prescription.Patient.FirstName + " " + prescription.Patient.LastName,
                    Age = DateTime.UtcNow.Year - prescription.Patient.DateOfBirth.Year,
                    prescription.Patient.Gender,
                    prescription.Patient.BloodGroup
                },
                Doctor = new
                {
                    prescription.Doctor.Id,
                    prescription.Doctor.FullName,
                    prescription.Doctor.Specialization,
                    Department = prescription.Doctor.Department.Name,
                    prescription.Doctor.LicenseNumber
                },
                Medicines = prescription.Medicines.Select(m => new
                {
                    m.Id,
                    m.MedicineName,
                    m.GenericName,
                    m.Dosage,
                    m.Frequency,
                    m.DurationDays,
                    m.TotalQuantity,
                    m.MealInstruction,
                    m.SpecialInstructions
                })
            }
        });
    }

    [HttpPost("prescriptions")]
    public async Task<ActionResult> CreatePrescription([FromBody] CreatePrescriptionRequest request)
    {
        var count = await _context.Prescriptions.CountAsync();
        var prescriptionNumber = $"RX-{DateTime.UtcNow:yyyyMMdd}-{(count + 1):D4}";

        var prescription = new Prescription
        {
            PrescriptionNumber = prescriptionNumber,
            EncounterId = request.EncounterId,
            PatientId = request.PatientId,
            DoctorId = request.DoctorId,
            DoctorNotes = request.DoctorNotes,
            LifestyleAdvice = request.LifestyleAdvice,
            FollowUpDate = request.FollowUpDate,
            Status = "Active",
            Medicines = request.Medicines.Select(m => new PrescriptionMedicine
            {
                MedicineName = m.MedicineName.Trim(),
                GenericName = m.GenericName?.Trim(),
                Dosage = m.Dosage ?? "1-0-1",
                Frequency = m.Frequency ?? "Daily",
                DurationDays = m.DurationDays <= 0 ? 7 : m.DurationDays,
                TotalQuantity = m.TotalQuantity <= 0 ? 14 : m.TotalQuantity,
                MealInstruction = m.MealInstruction ?? "After Meal",
                SpecialInstructions = m.SpecialInstructions
            }).ToList()
        };

        _context.Prescriptions.Add(prescription);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPrescriptionById), new { id = prescription.Id }, new
        {
            success = true,
            data = new { prescription.Id, prescription.PrescriptionNumber, MedicineCount = prescription.Medicines.Count }
        });
    }
}

public class CreateEncounterRequest
{
    public Guid? AppointmentId { get; set; }
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public decimal? SystolicBp { get; set; }
    public decimal? DiastolicBp { get; set; }
    public decimal? PulseRate { get; set; }
    public decimal? TemperatureCelsius { get; set; }
    public decimal? Spo2Percentage { get; set; }
    public decimal? WeightKg { get; set; }
    public decimal? HeightCm { get; set; }
    public string ChiefComplaints { get; set; } = string.Empty;
    public string? HistoryOfPresentIllness { get; set; }
    public string? ExaminationFindings { get; set; }
    public string Diagnosis { get; set; } = string.Empty;
    public string? TreatmentPlan { get; set; }
    public string? FollowUpInstructions { get; set; }
}

public class CreatePrescriptionRequest
{
    public Guid? EncounterId { get; set; }
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public string? DoctorNotes { get; set; }
    public string? LifestyleAdvice { get; set; }
    public DateTime? FollowUpDate { get; set; }
    public List<PrescriptionItemDto> Medicines { get; set; } = new();
}

public class PrescriptionItemDto
{
    public string MedicineName { get; set; } = string.Empty;
    public string? GenericName { get; set; }
    public string? Dosage { get; set; } = "1-0-1";
    public string? Frequency { get; set; } = "Daily";
    public int DurationDays { get; set; } = 7;
    public int TotalQuantity { get; set; } = 14;
    public string? MealInstruction { get; set; } = "After Meal";
    public string? SpecialInstructions { get; set; }
}
