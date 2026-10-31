using HospitalMS.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HospitalMS.API.Controllers.V1;

[ApiController]
[Authorize]
[Route("api/v1/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    private ISender? _mediator;
    protected ISender Mediator => _mediator ??= HttpContext.RequestServices.GetRequiredService<ISender>();

    protected ActionResult HandleResult<T>(Result<T> result)
    {
        if (result.IsSuccess)
        {
            return Ok(new
            {
                success = true,
                data = result.Value,
                error = (string?)null
            });
        }

        return BadRequest(new
        {
            success = false,
            data = default(T),
            error = result.ErrorMessage,
            code = result.ErrorCode
        });
    }

    protected ActionResult HandleResult(Result result)
    {
        if (result.IsSuccess)
        {
            return Ok(new
            {
                success = true,
                error = (string?)null
            });
        }

        return BadRequest(new
        {
            success = false,
            error = result.ErrorMessage,
            code = result.ErrorCode
        });
    }

    protected static (int Page, int PageSize) NormalizePaging(int page, int pageSize, int maxPageSize = 100)
    {
        return (Math.Max(1, page), Math.Clamp(pageSize, 1, maxPageSize));
    }

    protected string GetClientIpAddress()
    {
        if (Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor))
        {
            var ip = forwardedFor.FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(ip))
                return ip.Split(',')[0].Trim();
        }

        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
    }
}

