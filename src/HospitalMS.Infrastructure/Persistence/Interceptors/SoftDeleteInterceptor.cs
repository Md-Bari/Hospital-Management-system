using HospitalMS.Application.Common.Interfaces;
using HospitalMS.Domain.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace HospitalMS.Infrastructure.Persistence.Interceptors;

public class SoftDeleteInterceptor : SaveChangesInterceptor
{
    private readonly ICurrentUserService _currentUserService;

    public SoftDeleteInterceptor(ICurrentUserService currentUserService)
    {
        _currentUserService = currentUserService;
    }

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        MutateSoftDelete(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
    {
        MutateSoftDelete(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void MutateSoftDelete(DbContext? context)
    {
        if (context == null) return;

        var utcNow = DateTime.UtcNow;
        var currentUserId = _currentUserService.UserId;

        foreach (var entry in context.ChangeTracker.Entries<ISoftDeletable>())
        {
            if (entry.State == EntityState.Deleted)
            {
                entry.State = EntityState.Modified;
                entry.Entity.IsDeleted = true;
                entry.Entity.DeletedAt = utcNow;
                entry.Entity.DeletedBy = currentUserId;
            }
        }
    }
}

