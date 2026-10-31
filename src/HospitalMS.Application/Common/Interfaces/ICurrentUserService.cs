namespace HospitalMS.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? UserName { get; }
    string? Email { get; }
    Guid? BranchId { get; }
    Guid? DepartmentId { get; }
    IReadOnlyList<string> Roles { get; }
    bool IsAuthenticated { get; }
    bool HasPermission(string permission);
}

public interface ICacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);
    Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default);
    Task RemoveAsync(string key, CancellationToken cancellationToken = default);
    Task<bool> AcquireLockAsync(string key, string value, TimeSpan lockDuration, CancellationToken cancellationToken = default);
    Task<bool> ReleaseLockAsync(string key, string value, CancellationToken cancellationToken = default);
}

public interface IDateTime
{
    DateTime UtcNow { get; }
    DateTime NowLocal { get; }
}

