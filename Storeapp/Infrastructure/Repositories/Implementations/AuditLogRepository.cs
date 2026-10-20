using Infrastructure.Context;
using Infrastructure.Repositories.Implementations;
using Microsoft.EntityFrameworkCore;

public class AuditLogRepository
    : GenericRepository<AuditLog>, IAuditLogRepository
{
    public AuditLogRepository(ApplicationDbContext context)
        : base(context) { }

    public async Task<IEnumerable<AuditLog>> GetByUserIdAsync(string userId)
    {
        return await _dbSet
            .Where(x => x.UserId == userId)
            .ToListAsync();
    }

    public async Task<IEnumerable<AuditLog>> GetByEntityAsync(string entityName, string? entityId = null)
    {
        var query = _dbSet
            .Where(x => x.EntityName == entityName);

        if (!string.IsNullOrEmpty(entityId))
        {
            query = query.Where(x => x.EntityId == entityId);
        }

        return await query.ToListAsync();
    }
}