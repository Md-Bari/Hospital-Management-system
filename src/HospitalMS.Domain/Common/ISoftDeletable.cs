namespace HospitalMS.Domain.Common;

public interface ISoftDeletable
{
    bool IsDeleted { get; set; }
    DateTime? DeletedAt { get; set; }
    Guid? DeletedBy { get; set; }
}

public interface IHasConcurrencyToken
{
    byte[]? ConcurrencyToken { get; set; }
}

