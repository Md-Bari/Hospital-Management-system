using HospitalMS.Application.Common.Interfaces;
using HospitalMS.Application.Features.Auth.DTOs;
using HospitalMS.Domain.Common;
using HospitalMS.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.Application.Features.Auth.Queries.GetCurrentUser;

public record GetCurrentUserQuery(Guid UserId) : IRequest<Result<UserDto>>;

public class GetCurrentUserQueryHandler : IRequestHandler<GetCurrentUserQuery, Result<UserDto>>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IApplicationDbContext _context;

    public GetCurrentUserQueryHandler(
        UserManager<ApplicationUser> userManager,
        IApplicationDbContext context)
    {
        _userManager = userManager;
        _context = context;
    }

    public async Task<Result<UserDto>> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.Branch)
            .Include(u => u.Department)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null || !user.IsActive)
        {
            return Result<UserDto>.Failure("User not found or inactive.");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var roleNames = roles.ToList();

        var permissions = await _context.RolePermissions
            .Include(rp => rp.Role)
            .Include(rp => rp.Permission)
            .Where(rp => roleNames.Contains(rp.Role.Name!))
            .Select(rp => rp.Permission.Code)
            .Distinct()
            .ToListAsync(cancellationToken);

        return Result<UserDto>.Success(new UserDto
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber,
            BranchId = user.BranchId,
            BranchName = user.Branch?.Name,
            DepartmentId = user.DepartmentId,
            DepartmentName = user.Department?.Name,
            Roles = roles,
            Permissions = permissions
        });
    }
}

