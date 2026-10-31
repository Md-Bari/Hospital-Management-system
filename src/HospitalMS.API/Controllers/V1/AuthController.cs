using System.Collections.Concurrent;
using System.Security.Claims;
using HospitalMS.Application.Common.Interfaces;
using HospitalMS.Application.Features.Auth.Commands.Login;
using HospitalMS.Application.Features.Auth.Commands.RefreshToken;
using HospitalMS.Application.Features.Auth.Commands.Register;
using HospitalMS.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.API.Controllers.V1;

public class AuthController : BaseApiController
{
    private const string SelfServiceRole = "Patient";
    private static readonly string[] StaffProvisioningRoles = { "SuperAdmin", "HospitalAdmin", "HRManager" };

    // In-memory fallback cache for OTPs in case Redis is unavailable
    private static readonly ConcurrentDictionary<string, OtpRecord> OtpMemoryCache = new();

    private readonly IApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly ICacheService _cacheService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IApplicationDbContext context,
        IEmailService emailService,
        ICacheService cacheService,
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        IJwtTokenGenerator jwtTokenGenerator,
        ILogger<AuthController> logger)
    {
        _context = context;
        _emailService = emailService;
        _cacheService = cacheService;
        _userManager = userManager;
        _roleManager = roleManager;
        _jwtTokenGenerator = jwtTokenGenerator;
        _logger = logger;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult> Login([FromBody] LoginRequest request)
    {
        var command = new LoginCommand(request.Email, request.Password, GetClientIpAddress());
        var result = await Mediator.Send(command);

        if (result.IsSuccess)
        {
            SetRefreshTokenCookie(result.Value.RefreshToken, result.Value.RefreshTokenExpiresAt);
        }

        return HandleResult(result);
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult> Register([FromBody] RegisterCommand command)
    {
        var requestedRole = string.IsNullOrWhiteSpace(command.RoleName) ? SelfServiceRole : command.RoleName.Trim();
        var isAdmin = StaffProvisioningRoles.Any(User.IsInRole);
        if (!string.Equals(requestedRole, SelfServiceRole, StringComparison.OrdinalIgnoreCase) && !isAdmin)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                success = false,
                error = "Only administrators can create staff accounts.",
                code = "FORBIDDEN"
            });
        }

        var result = await Mediator.Send(command with { RoleName = requestedRole });
        return HandleResult(result);
    }

    /// <summary>
    /// Step 1: Send a 6-digit OTP via SMTP to patient's email for registration verification
    /// </summary>
    [HttpPost("patient/send-otp")]
    [AllowAnonymous]
    public async Task<ActionResult> SendPatientOtp([FromBody] SendPatientOtpRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains('@'))
        {
            return BadRequest(new { success = false, error = "A valid email address is required." });
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { success = false, error = "Patient name is required." });
        }

        if (string.IsNullOrWhiteSpace(request.Phone))
        {
            return BadRequest(new { success = false, error = "Phone number is required." });
        }

        var cleanEmail = request.Email.Trim().ToLowerInvariant();
        var cleanPhone = request.Phone.Trim();
        var cleanName = request.Name.Trim();

        // Check if an existing patient already has this email
        var existingPatient = await _context.Patients
            .AsNoTracking()
            .FirstOrDefaultAsync(p => !p.IsDeleted && (p.Email != null && p.Email.ToLower() == cleanEmail));

        // Generate 6-digit numeric OTP code
        var otpCode = Random.Shared.Next(100000, 999999).ToString("D6");
        var expiresAt = DateTime.UtcNow.AddMinutes(10);

        var otpRecord = new OtpRecord
        {
            Email = cleanEmail,
            Otp = otpCode,
            Name = cleanName,
            Phone = cleanPhone,
            ExpiresAt = expiresAt
        };

        // 1. Cache in Redis
        try
        {
            await _cacheService.SetAsync($"otp:patient:{cleanEmail}", otpRecord, TimeSpan.FromMinutes(10));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to write OTP to Redis for {Email}", cleanEmail);
        }

        // 2. Cache in in-memory backup dictionary
        OtpMemoryCache[cleanEmail] = otpRecord;

        // 3. Send Email via SMTP
        var emailSent = await _emailService.SendPatientRegistrationOtpAsync(cleanEmail, cleanName, otpCode, 10);

        // Mask email for response
        var emailParts = cleanEmail.Split('@');
        var maskedUser = emailParts[0].Length > 2
            ? emailParts[0][0] + new string('*', emailParts[0].Length - 2) + emailParts[0][^1]
            : emailParts[0] + "***";
        var maskedEmail = $"{maskedUser}@{emailParts[1]}";

        return Ok(new
        {
            success = true,
            message = emailSent
                ? $"A 6-digit OTP verification code has been sent to {maskedEmail}."
                : $"OTP code generated for {cleanEmail}. Check hospital log/email for code.",
            data = new
            {
                email = maskedEmail,
                expiresInSeconds = 600,
                // Include test code in dev if SMTP was offline/local demo
                devCode = !emailSent ? otpCode : (string?)null
            }
        });
    }

    /// <summary>
    /// Step 2: Verify email OTP code and register patient profile + user account
    /// </summary>
    [HttpPost("patient/verify-otp")]
    [AllowAnonymous]
    public async Task<ActionResult> VerifyPatientOtp([FromBody] VerifyPatientOtpRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Otp))
        {
            return BadRequest(new { success = false, error = "Email and OTP verification code are required." });
        }

        var cleanEmail = request.Email.Trim().ToLowerInvariant();
        var cleanOtp = request.Otp.Trim();

        // Retrieve OTP record (try Redis first, fallback to memory cache)
        OtpRecord? record = null;
        try
        {
            record = await _cacheService.GetAsync<OtpRecord>($"otp:patient:{cleanEmail}");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis read failed for OTP: {Email}", cleanEmail);
        }

        if (record == null && OtpMemoryCache.TryGetValue(cleanEmail, out var memRecord))
        {
            record = memRecord;
        }

        if (record == null || record.Otp != cleanOtp || DateTime.UtcNow > record.ExpiresAt)
        {
            return BadRequest(new
            {
                success = false,
                error = "Invalid or expired OTP code. Please request a new verification code."
            });
        }

        // OTP is valid! Clean up OTP cache
        try
        {
            await _cacheService.RemoveAsync($"otp:patient:{cleanEmail}");
        }
        catch { }
        OtpMemoryCache.TryRemove(cleanEmail, out _);

        // Parse Name
        var fullName = !string.IsNullOrWhiteSpace(request.Name) ? request.Name.Trim() : record.Name;
        var nameParts = fullName.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        var firstName = nameParts.Length > 0 ? nameParts[0] : "Patient";
        var lastName = nameParts.Length > 1 ? nameParts[1] : string.Empty;
        var phone = !string.IsNullOrWhiteSpace(request.Phone) ? request.Phone.Trim() : record.Phone;

        // Check or create Patient entity
        var patient = await _context.Patients
            .FirstOrDefaultAsync(p => !p.IsDeleted && (p.Email != null && p.Email.ToLower() == cleanEmail));

        if (patient == null)
        {
            var prefix = $"DCH-{DateTime.UtcNow:yyyyMM}-";
            var countThisMonth = await _context.Patients.CountAsync(p => p.PatientUid.StartsWith(prefix));
            var patientUid = $"{prefix}{(countThisMonth + 1):D4}";

            patient = new Patient
            {
                PatientUid = patientUid,
                FirstName = firstName,
                LastName = lastName,
                DateOfBirth = request.DateOfBirth ?? DateTime.UtcNow.AddYears(-28),
                Gender = request.Gender ?? "Other",
                BloodGroup = request.BloodGroup ?? "Unknown",
                Phone = phone,
                Email = cleanEmail,
                Address = request.Address?.Trim() ?? "Dhaka, Bangladesh",
                KnownAllergies = request.KnownAllergies,
                ChronicConditions = request.ChronicConditions,
                IsActive = true
            };

            _context.Patients.Add(patient);
            await _context.SaveChangesAsync();
        }

        // Check or create ApplicationUser for Patient Portal access
        var user = await _userManager.FindByEmailAsync(cleanEmail);
        if (user == null)
        {
            user = new ApplicationUser
            {
                UserName = cleanEmail,
                Email = cleanEmail,
                PhoneNumber = phone,
                FullName = fullName,
                IsActive = true,
                EmailConfirmed = true // Verified via OTP!
            };

            var pwd = !string.IsNullOrWhiteSpace(request.Password) ? request.Password : $"P@ss{Random.Shared.Next(1000, 9999)}#HMS";
            var userResult = await _userManager.CreateAsync(user, pwd);

            if (userResult.Succeeded)
            {
                // Ensure Patient role exists
                if (!await _roleManager.RoleExistsAsync(SelfServiceRole))
                {
                    await _roleManager.CreateAsync(new ApplicationRole { Name = SelfServiceRole, Description = "Hospital Registered Patient" });
                }
                await _userManager.AddToRoleAsync(user, SelfServiceRole);
            }
        }
        else
        {
            user.EmailConfirmed = true;
            await _userManager.UpdateAsync(user);
        }

        // Generate JWT Access and Refresh Tokens
        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = _jwtTokenGenerator.GenerateAccessToken(user, roles, Array.Empty<string>());
        var refreshToken = _jwtTokenGenerator.GenerateRefreshToken(user.Id, GetClientIpAddress());

        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        SetRefreshTokenCookie(refreshToken.Token, refreshToken.ExpiresAt);

        return Ok(new
        {
            success = true,
            message = "Patient registered and email verified successfully!",
            data = new
            {
                patientId = patient.Id,
                patientUid = patient.PatientUid,
                fullName = patient.FullName,
                email = patient.Email,
                phone = patient.Phone,
                bloodGroup = patient.BloodGroup,
                token = accessToken,
                refreshToken = refreshToken.Token,
                expiresAt = DateTime.UtcNow.AddMinutes(15)
            }
        });
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult> RefreshToken([FromBody] RefreshTokenRequest? request)
    {
        var token = request?.RefreshToken ?? Request.Cookies["refreshToken"];
        if (string.IsNullOrWhiteSpace(token))
        {
            return BadRequest(new { success = false, error = "Refresh token is missing." });
        }

        var command = new RefreshTokenCommand(token, GetClientIpAddress());
        var result = await Mediator.Send(command);

        if (result.IsSuccess)
        {
            SetRefreshTokenCookie(result.Value.RefreshToken, result.Value.RefreshTokenExpiresAt);
        }

        return HandleResult(result);
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<ActionResult> Logout([FromBody] RefreshTokenRequest? request)
    {
        var token = request?.RefreshToken ?? Request.Cookies["refreshToken"];
        if (!string.IsNullOrWhiteSpace(token))
        {
            var stored = await _context.RefreshTokens.FirstOrDefaultAsync(t => t.Token == token);
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var ownedByCaller = userIdClaim == null || stored?.UserId.ToString() == userIdClaim;
            if (stored != null && stored.RevokedAt == null && ownedByCaller)
            {
                stored.RevokedAt = DateTime.UtcNow;
                stored.RevokedByIp = GetClientIpAddress();
                await _context.SaveChangesAsync();
            }
        }

        Response.Cookies.Delete("refreshToken");
        return Ok(new { success = true, message = "Logged out successfully." });
    }

    private void SetRefreshTokenCookie(string token, DateTime expires)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Expires = expires,
            Secure = Request.IsHttps,
            SameSite = SameSiteMode.Lax
        };

        Response.Cookies.Append("refreshToken", token, cookieOptions);
    }
}

public class OtpRecord
{
    public string Email { get; set; } = string.Empty;
    public string Otp { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}

public class SendPatientOtpRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}

public class VerifyPatientOtpRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Otp { get; set; } = string.Empty;
    public string? Password { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? BloodGroup { get; set; }
    public string? Address { get; set; }
    public string? KnownAllergies { get; set; }
    public string? ChronicConditions { get; set; }
}

public record LoginRequest(string Email, string Password);
public record RefreshTokenRequest(string? RefreshToken);
