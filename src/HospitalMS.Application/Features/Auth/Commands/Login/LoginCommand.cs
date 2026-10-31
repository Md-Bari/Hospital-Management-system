using FluentValidation;
using HospitalMS.Application.Common.Interfaces;
using HospitalMS.Application.Features.Auth.DTOs;
using HospitalMS.Domain.Common;
using HospitalMS.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.Application.Features.Auth.Commands.Login;

public record LoginCommand(string Email, string Password, string IpAddress) : IRequest<Result<AuthResponseDto>>;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(v => v.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.");

        RuleFor(v => v.Password)
            .NotEmpty().WithMessage("Password is required.");
    }
}

public class LoginCommandHandler : IRequestHandler<LoginCommand, Result<AuthResponseDto>>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly IApplicationDbContext _context;

    public LoginCommandHandler(
        UserManager<ApplicationUser> userManager,
        IJwtTokenGenerator jwtTokenGenerator,
        IApplicationDbContext context)
    {
        _userManager = userManager;
        _jwtTokenGenerator = jwtTokenGenerator;
        _context = context;
    }

    public async Task<Result<AuthResponseDto>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || !user.IsActive)
        {
            return Result<AuthResponseDto>.Failure("Invalid email or password.");
        }

        if (await _userManager.IsLockedOutAsync(user))
        {
            return Result<AuthResponseDto>.Failure("Account is temporarily locked due to repeated failed sign-in attempts. Try again later.", "ACCOUNT_LOCKED");
        }

        var isPasswordValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!isPasswordValid)
        {
            // CheckPasswordAsync does not count failures on its own; without this the configured lockout never triggers.
            await _userManager.AccessFailedAsync(user);
            return Result<AuthResponseDto>.Failure("Invalid email or password.");
        }

        await _userManager.ResetAccessFailedCountAsync(user);

        var roles = await _userManager.GetRolesAsync(user);

        // Fetch permissions for all assigned roles
        var roleNames = roles.ToList();
        var permissions = await _context.RolePermissions
            .Include(rp => rp.Role)
            .Include(rp => rp.Permission)
            .Where(rp => roleNames.Contains(rp.Role.Name!))
            .Select(rp => rp.Permission.Code)
            .Distinct()
            .ToListAsync(cancellationToken);

        // Generate Access Token and Refresh Token
        var accessToken = _jwtTokenGenerator.GenerateAccessToken(user, roles, permissions);
        var refreshToken = _jwtTokenGenerator.GenerateRefreshToken(user.Id, request.IpAddress);

        await _context.RefreshTokens.AddAsync(refreshToken, cancellationToken);
        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        // Resolve branch and department names if assigned
        string? branchName = null;
        if (user.BranchId.HasValue)
        {
            var branch = await _context.Branches.FindAsync(new object[] { user.BranchId.Value }, cancellationToken);
            branchName = branch?.Name;
        }

        string? departmentName = null;
        if (user.DepartmentId.HasValue)
        {
            var dept = await _context.Departments.FindAsync(new object[] { user.DepartmentId.Value }, cancellationToken);
            departmentName = dept?.Name;
        }

        var authResponse = new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken.Token,
            ExpiresAt = DateTime.UtcNow.AddMinutes(15),
            RefreshTokenExpiresAt = refreshToken.ExpiresAt,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber,
                BranchId = user.BranchId,
                BranchName = branchName,
                DepartmentId = user.DepartmentId,
                DepartmentName = departmentName,
                Roles = roles,
                Permissions = permissions
            }
        };

        return Result<AuthResponseDto>.Success(authResponse);
    }
}

