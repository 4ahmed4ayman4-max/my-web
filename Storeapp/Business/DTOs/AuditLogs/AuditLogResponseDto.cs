

namespace Business.DTOs.AuditLogs;

public class AuditLogResponseDto
{
    public long Id { get; set; }
    public string UserId { get; set; } = null!;
    public string Action { get; set; } = null!;
    public string EntityName { get; set; } = null!;
    public string? EntityId { get; set; }
    public string? IpAddress { get; set; }
    public DateTime CreatedAt { get; set; }
}