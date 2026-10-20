using Infrastructure.Entities;
using Infrastructure.Repositories.Interfaces;

namespace Infrastructure.UnitOfWork;

public interface IUnitOfWork : IAsyncDisposable, IDisposable
{
    ICategoryRepository Category { get; }
    IProductRepository Products { get; }
    ICartRepository Carts { get; }
    IOrderRepository Orders { get; }
    IRefreshTokenRepository RefreshTokens { get; }
    IAuditLogRepository AuditLogs { get; }
    IDeliveryRepository Delivery { get; }

    IGenericRepository<TEntity> Repository<TEntity>() where TEntity : BaseEntity;

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Runs <paramref name="operation"/> inside a database transaction that is
    /// compatible with the configured retrying execution strategy
    /// (EnableRetryOnFailure). Commit happens on success, rollback on failure.
    /// </summary>
    Task<T> ExecuteInTransactionAsync<T>(Func<Task<T>> operation);
}