using Business.DTOs.AuditLogs;
using Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Policy = "AdminOnly")]
public class AuditController : ControllerBase
{
    private readonly IAuditService _auditService;

    public AuditController(IAuditService auditService)
    {
        _auditService = auditService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AuditLogResponseDto>>> GetAll()
    {
        var logs = await _auditService.GetAllAsync();

        return Ok(logs);
    }

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<IEnumerable<AuditLogResponseDto>>> GetByUserId(
        string userId)
    {
        var logs = await _auditService.GetByUserIdAsync(userId);

        return Ok(logs);
    }

    [HttpGet("entity/{entityName}")]
    public async Task<ActionResult<IEnumerable<AuditLogResponseDto>>> GetByEntity(
        string entityName,
        [FromQuery] string? entityId = null)
    {
        var logs = await _auditService.GetByEntityAsync(
            entityName,
            entityId);

        return Ok(logs);
    }
}