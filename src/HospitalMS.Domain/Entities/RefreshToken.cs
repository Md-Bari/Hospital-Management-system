using HospitalMS.Domain.Common;

namespace HospitalMS.Domain.Entities;

public class RefreshToken : BaseEntity
{
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedByIp { get; set; } = string.Empty;
    public DateTime? RevokedAt { get; set; }
    public string? RevokedByIp { get; set; }
    public string? ReplacedByToken { get; set; }

    public bool IsActive => RevokedAt == null && !IsExpired;
    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
}

public class AuditLog : BaseEntity
{
    public Guid? UserId { get; set; }
    public string? UserName { get; set; }
    public string Action { get; set; } = string.Empty; // Create, Update, Delete
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? AffectedColumns { get; set; }
    public string? IpAddress { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

