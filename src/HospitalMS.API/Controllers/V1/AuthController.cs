using HospitalMS.Application.Features.Auth.Commands.Login;
using HospitalMS.Application.Features.Auth.Commands.RefreshToken;
using HospitalMS.Application.Features.Auth.Commands.Register;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HospitalMS.API.Controllers.V1;

public class AuthController : BaseApiController
{
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult> Login([FromBody] LoginRequest request)
    {
        var command = new LoginCommand(request.Email, request.Password, GetClientIpAddress());
        var result = await Mediator.Send(command);

        if (result.IsSuccess)
        {
            SetRefreshTokenCookie(result.Value.RefreshToken, result.Value.ExpiresAt);
        }

        return HandleResult(result);
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult> Register([FromBody] RegisterCommand command)
    {
        var result = await Mediator.Send(command);
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
            SetRefreshTokenCookie(result.Value.RefreshToken, result.Value.ExpiresAt);
        }

        return HandleResult(result);
    }

    [HttpPost("logout")]
    [Authorize]
    public ActionResult Logout()
    {
        Response.Cookies.Delete("refreshToken");
        return Ok(new { success = true, message = "Logged out successfully." });
    }

    private void SetRefreshTokenCookie(string token, DateTime expires)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Expires = expires.AddDays(7),
            Secure = true,
            SameSite = SameSiteMode.Lax
        };

        Response.Cookies.Append("refreshToken", token, cookieOptions);
    }
}

public record LoginRequest(string Email, string Password);
public record RefreshTokenRequest(string? RefreshToken);

