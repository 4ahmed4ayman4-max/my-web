using Infrastructure.Context;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Api.Extensions;

public static class HealthCheckExtensions
{
    public static IServiceCollection ApplicationHealthChecks(
        this IServiceCollection services)
    {
        services.AddHealthChecks()
            .AddDbContextCheck<ApplicationDbContext>(
                name: "database",
                failureStatus: HealthStatus.Unhealthy,
                tags: new[] { "database", "ready" });

        return services;
    }
}