using MediatR;

namespace HospitalMS.Domain.Events;

public interface IDomainEvent : INotification
{
    Guid EventId { get; }
    DateTime OccurredOnUtc { get; }
}

public abstract class DomainEventBase : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredOnUtc { get; } = DateTime.UtcNow;
}

