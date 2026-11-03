using System.Security.Claims;
using HospitalMS.Application.Common.Interfaces;
using HospitalMS.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.API.Controllers.V1;

public class IpdController : BaseApiController
{
    private readonly IApplicationDbContext _context;

    public IpdController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("overview")]
    public async Task<ActionResult> GetOverview()
    {
        var totalBeds = await _context.Beds.CountAsync(b => !b.IsDeleted);
        var occupiedBeds = await _context.Beds.CountAsync(b => !b.IsDeleted && b.Status == "Occupied");
        var availableBeds = await _context.Beds.CountAsync(b => !b.IsDeleted && b.Status == "Available");
        var cleaningBeds = await _context.Beds.CountAsync(b => !b.IsDeleted && b.Status == "Cleaning");
        var maintenanceBeds = await _context.Beds.CountAsync(b => !b.IsDeleted && b.Status == "Maintenance");
        var totalWards = await _context.Wards.CountAsync(w => !w.IsDeleted && w.IsActive);
        var activeAdmissions = await _context.InpatientAdmissions.CountAsync(a => !a.IsDeleted && a.Status == "Admitted");

        var occupancyRate = totalBeds > 0 ? Math.Round((double)occupiedBeds / totalBeds * 100, 1) : 0;

        return Ok(new
        {
            success = true,
            data = new
            {
                totalBeds,
                occupiedBeds,
                availableBeds,
                cleaningBeds,
                maintenanceBeds,
                totalWards,
                activeAdmissions,
                occupancyRate,
                currency = "BDT",
                currencySymbol = "৳"
            }
        });
    }

    [HttpGet("wards")]
    public async Task<ActionResult> GetWards()
    {
        var wards = await _context.Wards
            .Where(w => !w.IsDeleted && w.IsActive)
            .Include(w => w.Beds.Where(b => !b.IsDeleted))
            .OrderBy(w => w.FloorNumber)
            .ThenBy(w => w.Name)
            .Select(w => new
            {
                w.Id,
                w.Name,
                w.Code,
                w.WardType,
                w.FloorNumber,
                w.GenderRestriction,
                w.DailyRate,
                DailyRateDisplay = $"৳{w.DailyRate:N0}/day",
                TotalBeds = w.Beds.Count(b => !b.IsDeleted),
                AvailableBeds = w.Beds.Count(b => !b.IsDeleted && b.Status == "Available"),
                OccupiedBeds = w.Beds.Count(b => !b.IsDeleted && b.Status == "Occupied"),
                CleaningBeds = w.Beds.Count(b => !b.IsDeleted && b.Status == "Cleaning"),
                MaintenanceBeds = w.Beds.Count(b => !b.IsDeleted && b.Status == "Maintenance")
            })
            .ToListAsync();

        return Ok(new
        {
            success = true,
            data = wards
        });
    }

    [HttpGet("beds")]
    public async Task<ActionResult> GetBeds(
        [FromQuery] Guid? wardId = null,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null)
    {
        var query = _context.Beds
            .Include(b => b.Ward)
            .Where(b => !b.IsDeleted && !b.Ward.IsDeleted)
            .AsNoTracking();

        if (wardId.HasValue)
        {
            query = query.Where(b => b.WardId == wardId.Value);
        }

        if (!string.IsNullOrWhiteSpace(status) && status != "All")
        {
            query = query.Where(b => b.Status.ToLower() == status.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.Trim().ToLower();
            query = query.Where(b => b.BedNumber.ToLower().Contains(searchLower) || b.Ward.Name.ToLower().Contains(searchLower));
        }

        var beds = await query
            .OrderBy(b => b.Ward.FloorNumber)
            .ThenBy(b => b.BedNumber)
            .Select(b => new
            {
                b.Id,
                b.BedNumber,
                b.BedType,
                b.DailyRate,
                DailyRateDisplay = $"৳{b.DailyRate:N0}/day",
                b.Status,
                b.CurrentAdmissionId,
                Ward = new
                {
                    b.Ward.Id,
                    b.Ward.Name,
                    b.Ward.Code,
                    b.Ward.WardType,
                    b.Ward.FloorNumber
                }
            })
            .ToListAsync();

        // Attach active patient details for occupied beds
        var occupiedAdmissionIds = beds
            .Where(b => b.CurrentAdmissionId.HasValue)
            .Select(b => b.CurrentAdmissionId!.Value)
            .Distinct()
            .ToList();

        var admissionsMap = await _context.InpatientAdmissions
            .Where(a => occupiedAdmissionIds.Contains(a.Id))
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
            .ToDictionaryAsync(a => a.Id, a => new
            {
                a.AdmissionNumber,
                PatientName = a.Patient.FirstName + " " + a.Patient.LastName,
                a.Patient.PatientUid,
                a.Patient.Phone,
                DoctorName = a.Doctor.FullName,
                a.AdmissionDate,
                a.ProvisionalDiagnosis,
                a.AdmissionPriority
            });

        var result = beds.Select(b =>
        {
            var admissionInfo = b.CurrentAdmissionId.HasValue && admissionsMap.ContainsKey(b.CurrentAdmissionId.Value)
                ? admissionsMap[b.CurrentAdmissionId.Value]
                : null;

            return new
            {
                b.Id,
                b.BedNumber,
                b.BedType,
                b.DailyRate,
                b.DailyRateDisplay,
                b.Status,
                b.Ward,
                CurrentAdmission = admissionInfo
            };
        });

        return Ok(new
        {
            success = true,
            data = result
        });
    }

    [HttpGet("admissions")]
    public async Task<ActionResult> GetAdmissions(
        [FromQuery] string? status = "Admitted",
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);

        var query = _context.InpatientAdmissions
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
                .ThenInclude(d => d.Department)
            .Include(a => a.Ward)
            .Include(a => a.Bed)
            .Where(a => !a.IsDeleted)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(status) && status != "All")
        {
            query = query.Where(a => a.Status.ToLower() == status.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.Trim().ToLower();
            query = query.Where(a =>
                a.AdmissionNumber.ToLower().Contains(searchLower) ||
                a.Patient.FirstName.ToLower().Contains(searchLower) ||
                a.Patient.LastName.ToLower().Contains(searchLower) ||
                a.Patient.PatientUid.ToLower().Contains(searchLower) ||
                a.Patient.Phone.Contains(searchLower) ||
                a.Doctor.FullName.ToLower().Contains(searchLower) ||
                a.Bed.BedNumber.ToLower().Contains(searchLower));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(a => a.AdmissionDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new
            {
                a.Id,
                a.AdmissionNumber,
                a.AdmissionDate,
                a.DischargeDate,
                a.Status,
                a.ProvisionalDiagnosis,
                a.AdmissionPriority,
                a.InitialDeposit,
                InitialDepositDisplay = $"৳{a.InitialDeposit:N0}",
                a.EstimatedDays,
                a.CareInstructions,
                a.DischargeSummary,
                a.AdmittedByRole,
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
                    Department = a.Doctor.Department.Name
                },
                Ward = new
                {
                    a.Ward.Id,
                    a.Ward.Name,
                    a.Ward.Code,
                    a.Ward.WardType,
                    a.Ward.FloorNumber
                },
                Bed = new
                {
                    a.Bed.Id,
                    a.Bed.BedNumber,
                    a.Bed.BedType,
                    a.Bed.DailyRate,
                    DailyRateDisplay = $"৳{a.Bed.DailyRate:N0}/day"
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
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            }
        });
    }

    [HttpPost("admissions")]
    public async Task<ActionResult> AdmitPatient([FromBody] AdmitPatientRequest request)
    {
        if (request == null)
            return BadRequest(new { success = false, error = "Request payload is required" });

        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.Id == request.PatientId && !p.IsDeleted);
        if (patient == null)
            return BadRequest(new { success = false, error = "Patient record not found" });

        var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.Id == request.DoctorId && !d.IsDeleted);
        if (doctor == null)
            return BadRequest(new { success = false, error = "Attending doctor not found" });

        var bed = await _context.Beds.Include(b => b.Ward).FirstOrDefaultAsync(b => b.Id == request.BedId && !b.IsDeleted);
        if (bed == null)
            return BadRequest(new { success = false, error = "Bed not found" });

        if (bed.Status != "Available")
            return BadRequest(new { success = false, error = $"Bed {bed.BedNumber} is currently {bed.Status}. Please select an Available bed." });

        // Check if patient is already admitted
        var existingActiveAdmission = await _context.InpatientAdmissions
            .AnyAsync(a => a.PatientId == request.PatientId && a.Status == "Admitted" && !a.IsDeleted);
        if (existingActiveAdmission)
            return BadRequest(new { success = false, error = "This patient already has an active inpatient admission." });

        var today = DateTime.UtcNow.Date;
        var admissionsTodayCount = await _context.InpatientAdmissions
            .CountAsync(a => a.CreatedAt >= today);

        var admissionNumber = $"IPD-{DateTime.UtcNow:yyyyMMdd}-{(admissionsTodayCount + 1):D4}";

        var currentRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "Staff";
        var currentUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Guid? currentUserId = Guid.TryParse(currentUserIdStr, out var parsedGuid) ? parsedGuid : null;

        var admission = new InpatientAdmission
        {
            AdmissionNumber = admissionNumber,
            PatientId = request.PatientId,
            DoctorId = request.DoctorId,
            WardId = bed.WardId,
            BedId = bed.Id,
            AdmissionDate = DateTime.UtcNow,
            Status = "Admitted",
            ProvisionalDiagnosis = string.IsNullOrWhiteSpace(request.ProvisionalDiagnosis) ? "Under Observation" : request.ProvisionalDiagnosis.Trim(),
            AdmissionPriority = string.IsNullOrWhiteSpace(request.AdmissionPriority) ? "Routine" : request.AdmissionPriority.Trim(),
            InitialDeposit = request.InitialDeposit >= 0 ? request.InitialDeposit : 0,
            EstimatedDays = request.EstimatedDays > 0 ? request.EstimatedDays : 3,
            CareInstructions = request.CareInstructions?.Trim(),
            AdmittedByRole = currentRole,
            AdmittedByUserId = currentUserId
        };

        _context.InpatientAdmissions.Add(admission);

        // Update bed status
        bed.Status = "Occupied";
        bed.CurrentAdmissionId = admission.Id;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            data = new
            {
                admission.Id,
                admission.AdmissionNumber,
                admission.AdmissionDate,
                admission.Status,
                PatientName = $"{patient.FirstName} {patient.LastName}",
                DoctorName = doctor.FullName,
                WardName = bed.Ward.Name,
                BedNumber = bed.BedNumber,
                InitialDepositDisplay = $"৳{admission.InitialDeposit:N0}"
            },
            message = $"Patient successfully admitted to Bed {bed.BedNumber} ({bed.Ward.Name})."
        });
    }

    [HttpPost("admissions/{id:guid}/discharge")]
    public async Task<ActionResult> DischargePatient(Guid id, [FromBody] DischargePatientRequest request)
    {
        var admission = await _context.InpatientAdmissions
            .Include(a => a.Bed)
            .Include(a => a.Patient)
            .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);

        if (admission == null)
            return NotFound(new { success = false, error = "Inpatient admission record not found" });

        if (admission.Status != "Admitted")
            return BadRequest(new { success = false, error = $"Patient is already {admission.Status}" });

        admission.Status = "Discharged";
        admission.DischargeDate = DateTime.UtcNow;
        admission.DischargeSummary = request?.DischargeSummary?.Trim() ?? "Patient clinically stabilized and discharged home.";

        // Free up the bed and set to Cleaning status
        if (admission.Bed != null)
        {
            admission.Bed.Status = "Cleaning";
            admission.Bed.CurrentAdmissionId = null;
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            data = new
            {
                admission.Id,
                admission.AdmissionNumber,
                admission.DischargeDate,
                admission.Status,
                BedNumber = admission.Bed?.BedNumber,
                BedStatus = admission.Bed?.Status
            },
            message = "Patient discharge finalized successfully. Bed has been scheduled for sanitation."
        });
    }

    [HttpPost("admissions/{id:guid}/transfer-bed")]
    public async Task<ActionResult> TransferBed(Guid id, [FromBody] TransferBedRequest request)
    {
        if (request == null || request.NewBedId == Guid.Empty)
            return BadRequest(new { success = false, error = "Target Bed ID is required" });

        var admission = await _context.InpatientAdmissions
            .Include(a => a.Bed)
            .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);

        if (admission == null)
            return NotFound(new { success = false, error = "Inpatient admission record not found" });

        if (admission.Status != "Admitted")
            return BadRequest(new { success = false, error = "Can only transfer currently admitted patients" });

        if (admission.BedId == request.NewBedId)
            return BadRequest(new { success = false, error = "Patient is already assigned to this bed" });

        var newBed = await _context.Beds.Include(b => b.Ward).FirstOrDefaultAsync(b => b.Id == request.NewBedId && !b.IsDeleted);
        if (newBed == null)
            return BadRequest(new { success = false, error = "Target bed does not exist" });

        if (newBed.Status != "Available")
            return BadRequest(new { success = false, error = $"Target bed {newBed.BedNumber} is {newBed.Status}" });

        // Release old bed
        if (admission.Bed != null)
        {
            admission.Bed.Status = "Cleaning";
            admission.Bed.CurrentAdmissionId = null;
        }

        // Assign new bed
        newBed.Status = "Occupied";
        newBed.CurrentAdmissionId = admission.Id;

        admission.BedId = newBed.Id;
        admission.WardId = newBed.WardId;
        if (!string.IsNullOrWhiteSpace(request.Reason))
        {
            admission.CareInstructions += $" | Transferred to {newBed.BedNumber}: {request.Reason}";
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            data = new
            {
                admission.Id,
                NewBedNumber = newBed.BedNumber,
                NewWardName = newBed.Ward.Name
            },
            message = $"Patient successfully transferred to Bed {newBed.BedNumber} ({newBed.Ward.Name})."
        });
    }

    [HttpPatch("beds/{id:guid}/status")]
    public async Task<ActionResult> UpdateBedStatus(Guid id, [FromBody] UpdateBedStatusRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Status))
            return BadRequest(new { success = false, error = "Status is required" });

        var allowedStatuses = new[] { "Available", "Occupied", "Cleaning", "Maintenance" };
        var normalizedStatus = allowedStatuses.FirstOrDefault(s => s.Equals(request.Status.Trim(), StringComparison.OrdinalIgnoreCase));
        if (normalizedStatus == null)
            return BadRequest(new { success = false, error = $"Invalid status. Allowed: {string.Join(", ", allowedStatuses)}" });

        var bed = await _context.Beds.FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted);
        if (bed == null)
            return NotFound(new { success = false, error = "Bed not found" });

        if (bed.Status == "Occupied" && normalizedStatus == "Available" && bed.CurrentAdmissionId.HasValue)
            return BadRequest(new { success = false, error = "Cannot set occupied bed to Available without discharging or transferring the admitted patient." });

        bed.Status = normalizedStatus;
        if (normalizedStatus == "Available")
        {
            bed.CurrentAdmissionId = null;
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            data = new
            {
                bed.Id,
                bed.BedNumber,
                bed.Status
            },
            message = $"Bed {bed.BedNumber} status updated to {bed.Status}."
        });
    }
}

public class AdmitPatientRequest
{
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public Guid BedId { get; set; }
    public string ProvisionalDiagnosis { get; set; } = string.Empty;
    public string AdmissionPriority { get; set; } = "Routine"; // Routine, Urgent, Emergency
    public decimal InitialDeposit { get; set; }
    public int EstimatedDays { get; set; } = 3;
    public string? CareInstructions { get; set; }
}

public class DischargePatientRequest
{
    public string? DischargeSummary { get; set; }
}

public class TransferBedRequest
{
    public Guid NewBedId { get; set; }
    public string? Reason { get; set; }
}

public class UpdateBedStatusRequest
{
    public string Status { get; set; } = string.Empty;
}

