using Business.Interfaces;

namespace Business.Services;

public class AuditHelper : IAuditHelper
{
    private readonly IAuditService _auditService;
    private readonly ICurrentUserService _currentUserService;

    public AuditHelper(
        IAuditService auditService,
        ICurrentUserService currentUserService)
    {
        _auditService = auditService;
        _currentUserService = currentUserService;
    }

    public async Task LogAsync(
        string action,
        string entityName,
        string? entityId = null)
    {
        // Audit Admin actions only
        if (!_currentUserService.IsAdmin)
            return;

        if (string.IsNullOrWhiteSpace(_currentUserService.UserId))
            return;

        await _auditService.LogAsync(
            _currentUserService.UserId,
            action,
            entityName,
            entityId,
            _currentUserService.IpAddress);
    }
}