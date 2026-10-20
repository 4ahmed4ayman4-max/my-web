using Infrastructure.Context;
using Infrastructure.Entities;
using Infrastructure.Repositories;
using Infrastructure.Repositories.Implementations;
using Infrastructure.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.UnitOfWork;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private readonly Dictionary<Type, object> _repositories = new();

    private bool _disposed;

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context
            ?? throw new ArgumentNullException(nameof(context));

        // Specialized repositories
        Category = new CategoryRepository(context);
        Products = new ProductRepository(context);
        Carts = new CartRepository(context);
        Orders = new OrderRepository(context);
        RefreshTokens = new RefreshTokenRepository(context);
        AuditLogs = new AuditLogRepository(context);
        Delivery = new DeliveryRepository(context);
    }

    public ICategoryRepository Category { get; }

    public IProductRepository Products { get; }

    public ICartRepository Carts { get; }

    public IOrderRepository Orders { get; }

    public IRefreshTokenRepository RefreshTokens { get; }

    public IAuditLogRepository AuditLogs { get; }

    public IDeliveryRepository Delivery { get; }

    public IGenericRepository<TEntity> Repository<TEntity>()
        where TEntity : BaseEntity
    {
        var type = typeof(TEntity);

        if (!_repositories.TryGetValue(type, out var repository))
        {
            repository = new GenericRepository<TEntity>(_context);
            _repositories[type] = repository;
        }

        return (IGenericRepository<TEntity>)repository;
    }

    public async Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<T> ExecuteInTransactionAsync<T>(Func<Task<T>> operation)
    {
        if (operation == null)
            throw new ArgumentNullException(nameof(operation));

        // The connection is registered with EnableRetryOnFailure, so the default
        // execution strategy is a SqlServerRetryingExecutionStrategy. That strategy
        // does NOT allow user initiated transactions - the whole transactional
        // block has to be executed through the strategy itself, otherwise EF
        // throws "The configured execution strategy ... does not support
        // user-initiated transactions".
        var strategy = _context.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                var result = await operation();

                await transaction.CommitAsync();

                return result;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        });
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed)
            return;

        if (disposing)
        {
            _context.Dispose();
        }

        _disposed = true;
    }

    public async ValueTask DisposeAsync()
    {
        if (_disposed)
            return;

        await _context.DisposeAsync();

        _disposed = true;

        GC.SuppressFinalize(this);
    }
}