using FluentValidation;
using HospitalMS.Application.Common.Interfaces;
using HospitalMS.Application.Features.Auth.DTOs;
using HospitalMS.Domain.Common;
using HospitalMS.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace HospitalMS.Application.Features.Auth.Commands.Register;

public record RegisterCommand(
    string Email,
    string Password,
    string FullName,
    string? PhoneNumber,
    Guid? BranchId,
    Guid? DepartmentId,
    string? RoleName) : IRequest<Result<UserDto>>;

public class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(v => v.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.");

        RuleFor(v => v.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters.")
            .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches("[a-z]").WithMessage("Password must contain at least one lowercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain at least one number.")
            .Matches("[^a-zA-Z0-9]").WithMessage("Password must contain at least one special character.");

        RuleFor(v => v.FullName)
            .NotEmpty().WithMessage("Full Name is required.")
            .MaximumLength(150).WithMessage("Full Name cannot exceed 150 characters.");
    }
}

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<UserDto>>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;

    public RegisterCommandHandler(
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager)
    {
        _userManager = userManager;
        _roleManager = roleManager;
    }

    public async Task<Result<UserDto>> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return Result<UserDto>.Failure("A user with this email address already exists.");
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            PhoneNumber = request.PhoneNumber,
            BranchId = request.BranchId,
            DepartmentId = request.DepartmentId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var createResult = await _userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            var errors = string.Join("; ", createResult.Errors.Select(e => e.Description));
            return Result<UserDto>.Failure(errors);
        }

        // Assign default role (Patient if not specified, or requested role if valid)
        var roleToAssign = string.IsNullOrWhiteSpace(request.RoleName) ? "Patient" : request.RoleName;
        if (await _roleManager.RoleExistsAsync(roleToAssign))
        {
            await _userManager.AddToRoleAsync(user, roleToAssign);
        }

        return Result<UserDto>.Success(new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber,
            BranchId = user.BranchId,
            DepartmentId = user.DepartmentId,
            Roles = new List<string> { roleToAssign }
        });
    }
}

