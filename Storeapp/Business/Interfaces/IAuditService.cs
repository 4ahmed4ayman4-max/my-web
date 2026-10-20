using Business.DTOs.AuditLogs;

namespace Business.Interfaces;

public interface IAuditService
{
    Task LogAsync(
        string userId,
        string action,
        string entityName,
        string? entityId,
        string? ipAddress);

    Task<IEnumerable<AuditLogResponseDto>> GetAllAsync();

    Task<IEnumerable<AuditLogResponseDto>> GetByUserIdAsync(
        string userId);

    Task<IEnumerable<AuditLogResponseDto>> GetByEntityAsync(
        string entityName,
        string? entityId = null);
}