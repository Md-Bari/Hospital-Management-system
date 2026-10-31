using System.Security.Claims;
using HospitalMS.Application.Features.Auth.Queries.GetCurrentUser;
using HospitalMS.Domain.Entities;
using HospitalMS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.API.Controllers.V1;

[Authorize]
public class UsersController : BaseApiController
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;

    public UsersController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager)
    {
        _context = context;
        _userManager = userManager;
        _roleManager = roleManager;
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
    public async Task<ActionResult> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? role = null)
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
        var rawUsers = await query
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

        var userIds = rawUsers.Select(u => u.Id).ToList();

        // Query UserRoles directly from IdentityDbContext
        var userRoles = await _context.UserRoles
            .Where(ur => userIds.Contains(ur.UserId))
            .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, RoleName = r.Name })
            .ToListAsync();

        var rolesByUser = userRoles.ToLookup(x => x.UserId, x => x.RoleName!);

        var items = rawUsers.Select(u => new
        {
            u.Id,
            u.Email,
            u.FullName,
            u.PhoneNumber,
            u.IsActive,
            u.CreatedAt,
            u.LastLoginAt,
            u.BranchName,
            u.DepartmentName,
            Roles = rolesByUser[u.Id].ToList()
        }).ToList();

        if (!string.IsNullOrWhiteSpace(role))
        {
            items = items.Where(u => u.Roles.Contains(role, StringComparer.OrdinalIgnoreCase)).ToList();
        }

        return Ok(new
        {
            success = true,
            data = new
            {
                items,
                total,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling(total / (double)pageSize)
            }
        });
    }

    [HttpPost("{id:guid}/roles")]
    [Authorize(Roles = "SuperAdmin,HospitalAdmin")]
    public async Task<ActionResult> AssignUserRoles(Guid id, [FromBody] UpdateUserRolesRequest request)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null)
        {
            return NotFound(new { success = false, error = "User not found." });
        }

        // Validate requested roles exist
        foreach (var roleName in request.Roles)
        {
            if (!await _roleManager.RoleExistsAsync(roleName))
            {
                return BadRequest(new { success = false, error = $"Role '{roleName}' does not exist." });
            }
        }

        var currentRoles = await _userManager.GetRolesAsync(user);
        var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
        if (!removeResult.Succeeded)
        {
            return BadRequest(new { success = false, error = "Failed to clear current roles." });
        }

        var addResult = await _userManager.AddToRolesAsync(user, request.Roles);
        if (!addResult.Succeeded)
        {
            return BadRequest(new { success = false, error = "Failed to assign new roles." });
        }

        return Ok(new
        {
            success = true,
            message = "User roles updated successfully.",
            data = new { userId = user.Id, roles = request.Roles }
        });
    }

    [HttpPut("{id:guid}/status")]
    [Authorize(Roles = "SuperAdmin,HospitalAdmin")]
    public async Task<ActionResult> ToggleUserStatus(Guid id, [FromBody] ToggleUserStatusRequest request)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null)
        {
            return NotFound(new { success = false, error = "User not found." });
        }

        user.IsActive = request.IsActive;
        await _userManager.UpdateAsync(user);

        return Ok(new
        {
            success = true,
            message = $"User has been {(request.IsActive ? "activated" : "deactivated")} successfully.",
            data = new { userId = user.Id, isActive = user.IsActive }
        });
    }
}

public class UpdateUserRolesRequest
{
    public List<string> Roles { get; set; } = new();
}

public class ToggleUserStatusRequest
{
    public bool IsActive { get; set; }
}
