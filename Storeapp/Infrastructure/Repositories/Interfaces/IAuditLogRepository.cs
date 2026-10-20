using Infrastructure.Repositories.Interfaces;

public interface IAuditLogRepository : IGenericRepository<AuditLog>
{
    Task<IEnumerable<AuditLog>> GetByUserIdAsync(string userId);

    Task<IEnumerable<AuditLog>> GetByEntityAsync(string entityName, string? entityId = null);
}