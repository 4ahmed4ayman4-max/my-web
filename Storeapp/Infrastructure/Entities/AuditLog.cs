using Infrastructure.Entities;

public class AuditLog : BaseEntity
{

    public string UserId { get; set; } = null!;

    public string Action { get; set; } = null!;

    public string EntityName { get; set; } = null!;

    public string? EntityId { get; set; }

    public string? IpAddress { get; set; }

    public ApplicationUser User { get; set; } = null!;
}