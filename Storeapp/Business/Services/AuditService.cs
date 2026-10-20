using AutoMapper;
using Business.DTOs.AuditLogs;
using Business.Interfaces;
using Infrastructure.UnitOfWork;

namespace Business.Services;

public class AuditService : IAuditService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public AuditService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task LogAsync(
        string userId,
        string action,
        string entityName,
        string? entityId,
        string? ipAddress)
    {
        var auditLog = new AuditLog
        {
            UserId = userId,
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            IpAddress = ipAddress,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.AuditLogs.AddAsync(auditLog);

        // The audit entry is written on its own so it is persisted even when the
        // caller has already flushed its own changes.
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<IEnumerable<AuditLogResponseDto>> GetAllAsync()
    {
        var logs = await _unitOfWork.AuditLogs.GetAllAsync();

        return _mapper.Map<IEnumerable<AuditLogResponseDto>>(logs);
    }

    public async Task<IEnumerable<AuditLogResponseDto>> GetByUserIdAsync(
        string userId)
    {
        var logs = await _unitOfWork.AuditLogs
            .GetByUserIdAsync(userId);

        return _mapper.Map<IEnumerable<AuditLogResponseDto>>(logs);
    }

    public async Task<IEnumerable<AuditLogResponseDto>> GetByEntityAsync(
        string entityName,
        string? entityId = null)
    {
        var logs = await _unitOfWork.AuditLogs
            .GetByEntityAsync(entityName, entityId);

        return _mapper.Map<IEnumerable<AuditLogResponseDto>>(logs);
    }
}