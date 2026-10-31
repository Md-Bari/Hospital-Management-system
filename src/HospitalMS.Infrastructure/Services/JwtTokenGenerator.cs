using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using HospitalMS.Application.Common.Interfaces;
using HospitalMS.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace HospitalMS.Infrastructure.Services;

public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly IConfiguration _configuration;

    public JwtTokenGenerator(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateAccessToken(ApplicationUser user, IList<string> roles, IEnumerable<string> permissions)
    {
        var secret = _configuration["JwtSettings:Secret"] ?? "HospitalMS_SuperSecretKeyForJWTAuth2026EnterpriseGrade_MustBeAtLeast32BytesLong!";
        var issuer = _configuration["JwtSettings:Issuer"] ?? "HospitalMS.API";
        var audience = _configuration["JwtSettings:Audience"] ?? "HospitalMS.Web";
        var expirationMinutes = int.Parse(_configuration["JwtSettings:AccessTokenExpirationMinutes"] ?? "15");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new("name", user.FullName),
            new("branchId", user.BranchId?.ToString() ?? string.Empty),
            new("departmentId", user.DepartmentId?.ToString() ?? string.Empty)
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        foreach (var permission in permissions)
        {
            claims.Add(new Claim("permission", permission));
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public RefreshToken GenerateRefreshToken(Guid userId, string ipAddress)
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);

        var days = int.Parse(_configuration["JwtSettings:RefreshTokenExpirationDays"] ?? "7");

        return new RefreshToken
        {
            UserId = userId,
            Token = Convert.ToBase64String(randomNumber),
            ExpiresAt = DateTime.UtcNow.AddDays(days),
            CreatedByIp = ipAddress,
            CreatedAt = DateTime.UtcNow
        };
    }

    public ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var secret = _configuration["JwtSettings:Secret"] ?? "HospitalMS_SuperSecretKeyForJWTAuth2026EnterpriseGrade_MustBeAtLeast32BytesLong!";
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = false,
            ValidateIssuer = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
            ValidateLifetime = false // Here we don't care about token's expiration date
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);

        if (securityToken is not JwtSecurityToken jwtSecurityToken ||
            !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
        {
            throw new SecurityTokenException("Invalid token algorithm");
        }

        return principal;
    }
}

