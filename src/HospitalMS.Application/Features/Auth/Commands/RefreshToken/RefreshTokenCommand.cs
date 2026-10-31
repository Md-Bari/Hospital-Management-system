using HospitalMS.Application.Common.Interfaces;
using HospitalMS.Application.Features.Auth.DTOs;
using HospitalMS.Domain.Common;
using HospitalMS.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.Application.Features.Auth.Commands.RefreshToken;

public record RefreshTokenCommand(string Token, string IpAddress) : IRequest<Result<AuthResponseDto>>;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, Result<AuthResponseDto>>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly IApplicationDbContext _context;

    public RefreshTokenCommandHandler(
        UserManager<ApplicationUser> userManager,
        IJwtTokenGenerator jwtTokenGenerator,
        IApplicationDbContext context)
    {
        _userManager = userManager;
        _jwtTokenGenerator = jwtTokenGenerator;
        _context = context;
    }

    public async Task<Result<AuthResponseDto>> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.RefreshTokens)
            .FirstOrDefaultAsync(u => u.RefreshTokens.Any(t => t.Token == request.Token), cancellationToken);

        if (user == null || !user.IsActive)
        {
            return Result<AuthResponseDto>.Failure("Invalid refresh token.");
        }

        var existingToken = user.RefreshTokens.Single(x => x.Token == request.Token);

        if (!existingToken.IsActive)
        {
            // Possible token reuse attack - revoke all refresh tokens for this user
            foreach (var t in user.RefreshTokens.Where(t => t.IsActive))
            {
                t.RevokedAt = DateTime.UtcNow;
                t.RevokedByIp = request.IpAddress;
            }
            await _context.SaveChangesAsync(cancellationToken);
            return Result<AuthResponseDto>.Failure("Refresh token is inactive or revoked.");
        }

        // Revoke the old refresh token with replacement pointer
        var newRefreshToken = _jwtTokenGenerator.GenerateRefreshToken(user.Id, request.IpAddress);
        existingToken.RevokedAt = DateTime.UtcNow;
        existingToken.RevokedByIp = request.IpAddress;
        existingToken.ReplacedByToken = newRefreshToken.Token;

        await _context.RefreshTokens.AddAsync(newRefreshToken, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        var roles = await _userManager.GetRolesAsync(user);
        var roleNames = roles.ToList();
        var permissions = await _context.RolePermissions
            .Include(rp => rp.Role)
            .Include(rp => rp.Permission)
            .Where(rp => roleNames.Contains(rp.Role.Name!))
            .Select(rp => rp.Permission.Code)
            .Distinct()
            .ToListAsync(cancellationToken);

        var newAccessToken = _jwtTokenGenerator.GenerateAccessToken(user, roles, permissions);

        return Result<AuthResponseDto>.Success(new AuthResponseDto
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken.Token,
            ExpiresAt = DateTime.UtcNow.AddMinutes(15),
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber,
                BranchId = user.BranchId,
                DepartmentId = user.DepartmentId,
                Roles = roles,
                Permissions = permissions
            }
        });
    }
}

