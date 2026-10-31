using System.Security.Claims;
using HospitalMS.Application.Common.Interfaces;
using HospitalMS.Application.Features.Auth.Commands.Login;
using HospitalMS.Application.Features.Auth.Commands.RefreshToken;
using HospitalMS.Application.Features.Auth.Commands.Register;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.API.Controllers.V1;

public class AuthController : BaseApiController
{
    private const string SelfServiceRole = "Patient";
    private static readonly string[] StaffProvisioningRoles = { "SuperAdmin", "HospitalAdmin", "HRManager" };

    private readonly IApplicationDbContext _context;

    public AuthController(IApplicationDbContext context)
    {
        _context = context;
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
        // Anyone may self-register as a patient; any other role must be provisioned by an administrator.
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
        // Revoke server-side so a leaked refresh token cannot be replayed after sign-out.
        // Anonymous is allowed because the access token has often already expired at this point.
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

public record LoginRequest(string Email, string Password);
public record RefreshTokenRequest(string? RefreshToken);
