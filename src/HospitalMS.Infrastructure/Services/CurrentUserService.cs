using System.Security.Claims;
using HospitalMS.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;

namespace HospitalMS.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public Guid? UserId
    {
        get
        {
            var id = User?.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(id, out var parsedId) ? parsedId : null;
        }
    }

    public string? UserName => User?.FindFirstValue("name") ?? User?.FindFirstValue(ClaimTypes.Name);

    public string? Email => User?.FindFirstValue(ClaimTypes.Email);

    public Guid? BranchId
    {
        get
        {
            var branch = User?.FindFirstValue("branchId");
            return Guid.TryParse(branch, out var id) ? id : null;
        }
    }

    public Guid? DepartmentId
    {
        get
        {
            var dept = User?.FindFirstValue("departmentId");
            return Guid.TryParse(dept, out var id) ? id : null;
        }
    }

    public IReadOnlyList<string> Roles =>
        User?.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList() ?? new List<string>();

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

    public bool HasPermission(string permission) =>
        User?.Claims.Any(c => c.Type == "permission" && c.Value == permission) ?? false;
}

public class DateTimeService : IDateTime
{
    public DateTime UtcNow => DateTime.UtcNow;
    public DateTime NowLocal => TimeZoneInfo.ConvertTimeFromUtc(
        DateTime.UtcNow,
        TimeZoneInfo.FindSystemTimeZoneById("Asia/Dhaka"));
}

