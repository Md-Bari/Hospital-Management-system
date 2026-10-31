using System.Security.Claims;
using HospitalMS.Application.Common.Interfaces;
using HospitalMS.Application.Features.Auth.Queries.GetCurrentUser;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.API.Controllers.V1;

[Authorize]
public class UsersController : BaseApiController
{
    private readonly IApplicationDbContext _context;

    public UsersController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("me")]
    public async Task<ActionResult> GetCurrentUser()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId))
        {
            return Unauthorized(new { success = false, error = "Invalid user token claims." });
        }

        var result = await Mediator.Send(new GetCurrentUserQuery(userId));
        return HandleResult(result);
    }

    [HttpGet]
    [Authorize(Roles = "SuperAdmin,HospitalAdmin,BranchManager,HRManager")]
    public async Task<ActionResult> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null)
    {
        var query = _context.Users
            .Include(u => u.Branch)
            .Include(u => u.Department)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim().ToLower();
            query = query.Where(u =>
                u.FullName.ToLower().Contains(search) ||
                (u.Email != null && u.Email.ToLower().Contains(search)) ||
                (u.PhoneNumber != null && u.PhoneNumber.Contains(search)));
        }

        var total = await query.CountAsync();
        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.FullName,
                u.PhoneNumber,
                u.IsActive,
                u.CreatedAt,
                u.LastLoginAt,
                BranchName = u.Branch != null ? u.Branch.Name : null,
                DepartmentName = u.Department != null ? u.Department.Name : null
            })
            .ToListAsync();

        return Ok(new
        {
            success = true,
            data = new
            {
                items = users,
                total,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling(total / (double)pageSize)
            }
        });
    }
}

