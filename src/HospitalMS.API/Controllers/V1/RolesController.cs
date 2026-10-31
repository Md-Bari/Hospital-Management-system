using HospitalMS.Domain.Entities;
using HospitalMS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.API.Controllers.V1;

[Authorize]
public class RolesController : BaseApiController
{
    private readonly ApplicationDbContext _context;
    private readonly RoleManager<ApplicationRole> _roleManager;

    public RolesController(
        ApplicationDbContext context,
        RoleManager<ApplicationRole> roleManager)
    {
        _context = context;
        _roleManager = roleManager;
    }

    [HttpGet]
    [Authorize(Roles = "SuperAdmin,HospitalAdmin,BranchManager,HRManager")]
    public async Task<ActionResult> GetRoles()
    {
        var roles = await _context.Roles
            .Include(r => r.RolePermissions)
            .OrderBy(r => r.Name)
            .ToListAsync();

        var userRoleCounts = await _context.UserRoles
            .GroupBy(ur => ur.RoleId)
            .Select(g => new { RoleId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.RoleId, x => x.Count);

        var result = roles.Select(r => new
        {
            r.Id,
            r.Name,
            r.Description,
            r.IsSystemRole,
            UserCount = userRoleCounts.TryGetValue(r.Id, out var count) ? count : 0,
            PermissionsCount = r.RolePermissions.Count
        });

        return Ok(new
        {
            success = true,
            data = result
        });
    }

    [HttpGet("permissions")]
    [Authorize(Roles = "SuperAdmin,HospitalAdmin")]
    public async Task<ActionResult> GetAllPermissions()
    {
        var permissions = await _context.Permissions
            .OrderBy(p => p.Module)
            .ThenBy(p => p.Code)
            .ToListAsync();

        var grouped = permissions
            .GroupBy(p => p.Module)
            .Select(g => new
            {
                Module = g.Key,
                Permissions = g.Select(p => new
                {
                    p.Id,
                    p.Code,
                    p.Action,
                    p.Description
                })
            });

        return Ok(new
        {
            success = true,
            data = grouped
        });
    }

    [HttpGet("{roleName}/permissions")]
    [Authorize(Roles = "SuperAdmin,HospitalAdmin")]
    public async Task<ActionResult> GetRolePermissions(string roleName)
    {
        var role = await _roleManager.FindByNameAsync(roleName);
        if (role == null)
        {
            return NotFound(new { success = false, error = $"Role '{roleName}' not found." });
        }

        var assignedPermissions = await _context.RolePermissions
            .Where(rp => rp.RoleId == role.Id)
            .Include(rp => rp.Permission)
            .Select(rp => rp.Permission.Code)
            .ToListAsync();

        var allPermissions = await _context.Permissions
            .OrderBy(p => p.Module)
            .ThenBy(p => p.Code)
            .ToListAsync();

        var groupedCatalog = allPermissions
            .GroupBy(p => p.Module)
            .Select(g => new
            {
                Module = g.Key,
                Permissions = g.Select(p => new
                {
                    p.Id,
                    p.Code,
                    p.Action,
                    p.Description,
                    IsAssigned = assignedPermissions.Contains(p.Code)
                })
            });

        return Ok(new
        {
            success = true,
            data = new
            {
                roleName = role.Name,
                roleDescription = role.Description,
                assignedPermissions,
                catalog = groupedCatalog
            }
        });
    }

    [HttpPut("{roleName}/permissions")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> UpdateRolePermissions(string roleName, [FromBody] UpdateRolePermissionsRequest request)
    {
        var role = await _roleManager.FindByNameAsync(roleName);
        if (role == null)
        {
            return NotFound(new { success = false, error = $"Role '{roleName}' not found." });
        }

        // Prevent stripping SuperAdmin
        if (role.Name == "SuperAdmin")
        {
            return BadRequest(new { success = false, error = "SuperAdmin permissions are immutable system policies." });
        }

        // Verify all incoming codes exist
        var requestedPerms = await _context.Permissions
            .Where(p => request.PermissionCodes.Contains(p.Code))
            .ToListAsync();

        // Clear existing role permissions
        var currentRolePerms = await _context.RolePermissions
            .Where(rp => rp.RoleId == role.Id)
            .ToListAsync();

        _context.RolePermissions.RemoveRange(currentRolePerms);

        // Add new permissions
        foreach (var perm in requestedPerms)
        {
            _context.RolePermissions.Add(new RolePermission
            {
                RoleId = role.Id,
                PermissionId = perm.Id
            });
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = $"Permissions for role '{roleName}' updated successfully.",
            data = new
            {
                roleName = role.Name,
                assignedCount = requestedPerms.Count
            }
        });
    }
}

public class UpdateRolePermissionsRequest
{
    public List<string> PermissionCodes { get; set; } = new();
}
