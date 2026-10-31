using System.Security.Claims;
using HospitalMS.Domain.Entities;

namespace HospitalMS.Application.Common.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateAccessToken(ApplicationUser user, IList<string> roles, IEnumerable<string> permissions);
    RefreshToken GenerateRefreshToken(Guid userId, string ipAddress);
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
}

