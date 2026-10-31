using HospitalMS.Application.Features.Auth.Commands.Login;
using HospitalMS.Application.Features.Auth.Commands.Register;
using HospitalMS.Domain.Entities;
using HospitalMS.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace HospitalMS.UnitTests.Application;

public class AuthValidationTests
{
    private readonly LoginCommandValidator _loginValidator = new();
    private readonly RegisterCommandValidator _registerValidator = new();

    [Theory]
    [InlineData("", "Password123!", false)]
    [InlineData("invalid-email", "Password123!", false)]
    [InlineData("valid@hospitalms.com", "", false)]
    [InlineData("doctor@hospitalms.com", "Secret@123", true)]
    public void LoginCommandValidator_ValidatesProperly(string email, string password, bool expectedValid)
    {
        var command = new LoginCommand(email, password, "127.0.0.1");
        var result = _loginValidator.Validate(command);

        Assert.Equal(expectedValid, result.IsValid);
    }

    [Theory]
    [InlineData("dr.smith@hospitalms.com", "ValidPass1!", "Dr. John Smith", true)]
    [InlineData("dr.smith@hospitalms.com", "short", "Dr. John Smith", false)] // too short
    [InlineData("dr.smith@hospitalms.com", "alllowercase1!", "Dr. John Smith", false)] // no uppercase
    [InlineData("dr.smith@hospitalms.com", "ALLUPPERCASE1!", "Dr. John Smith", false)] // no lowercase
    [InlineData("dr.smith@hospitalms.com", "NoSpecialNumber1", "Dr. John Smith", false)] // no special char
    [InlineData("", "ValidPass1!", "Dr. John Smith", false)] // empty email
    public void RegisterCommandValidator_ValidatesPasswordRules(string email, string password, string fullName, bool expectedValid)
    {
        var command = new RegisterCommand(email, password, fullName, null, null, null, "Doctor");
        var result = _registerValidator.Validate(command);

        Assert.Equal(expectedValid, result.IsValid);
    }
}

public class JwtTokenGeneratorTests
{
    [Fact]
    public void JwtTokenGenerator_GeneratesValidToken_WithEmbeddedClaims()
    {
        var inMemorySettings = new Dictionary<string, string?>
        {
            {"JwtSettings:Secret", "HospitalMS_SuperSecretKeyForJWTAuth2026EnterpriseGrade_MustBeAtLeast32BytesLong!"},
            {"JwtSettings:Issuer", "HospitalMS.API"},
            {"JwtSettings:Audience", "HospitalMS.Web"},
            {"JwtSettings:AccessTokenExpirationMinutes", "15"},
            {"JwtSettings:RefreshTokenExpirationDays", "7"}
        };

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        var generator = new JwtTokenGenerator(configuration);

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "doctor@hospitalms.com",
            FullName = "Dr. James Thompson",
            BranchId = Guid.NewGuid(),
            DepartmentId = Guid.NewGuid()
        };

        var roles = new List<string> { "Doctor" };
        var permissions = new List<string> { "Clinical.View", "Prescriptions.Create" };

        var token = generator.GenerateAccessToken(user, roles, permissions);

        Assert.NotNull(token);
        Assert.NotEmpty(token);

        var refreshToken = generator.GenerateRefreshToken(user.Id, "127.0.0.1");
        Assert.NotNull(refreshToken.Token);
        Assert.Equal(user.Id, refreshToken.UserId);
        Assert.True(refreshToken.ExpiresAt > DateTime.UtcNow);
    }
}

