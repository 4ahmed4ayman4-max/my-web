

namespace Business.Interfaces
{
    public interface IAuditHelper
    {
        Task LogAsync(
            string action,
            string entityName,
            string? entityId = null);
    }
}
