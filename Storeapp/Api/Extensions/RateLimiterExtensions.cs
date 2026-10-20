using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using System.Threading.RateLimiting;

namespace Api.Extensions;

public static class RateLimiterExtensions
{
    private static readonly TimeSpan WindowDuration =
        TimeSpan.FromMinutes(1);

    public static IServiceCollection RateLimiterPolicies(
        this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode =
                StatusCodes.Status429TooManyRequests;

            // ============================================
            // Rejection Response + Security Logging
            // ============================================

            options.OnRejected = async (context, cancellationToken) =>
            {
                var httpContext = context.HttpContext;

                var retryAfter = 60;

                if (context.Lease.TryGetMetadata(
                        MetadataName.RetryAfter,
                        out var retryAfterValue))
                {
                    retryAfter = Math.Max(
                        1,
                        (int)Math.Ceiling(retryAfterValue.TotalSeconds));
                }

                // ============================================
                // Logging
                // ============================================

                var logger =
                    httpContext.RequestServices
                        .GetRequiredService<ILoggerFactory>()
                        .CreateLogger("RateLimiter");

                var ip =
                    httpContext.Connection.RemoteIpAddress?.ToString()
                    ?? "unknown";

                var userId =
                    httpContext.User.FindFirstValue(
                        ClaimTypes.NameIdentifier)
                    ?? "anonymous";

                var endpoint =
                    httpContext.Request.Path;

                var policy =
                    httpContext.GetEndpoint()?
                        .Metadata
                        .GetMetadata<EnableRateLimitingAttribute>()?
                        .PolicyName
                    ?? "unknown";

                logger.LogWarning(
                    "Rate limit exceeded. Policy: {Policy}, UserId: {UserId}, IP: {IpAddress}, Endpoint: {Endpoint}, RetryAfter: {RetryAfterSeconds}s",
                    policy,
                    userId,
                    ip,
                    endpoint,
                    retryAfter);

                // ============================================
                // Response
                // ============================================

                httpContext.Response.StatusCode =
                    StatusCodes.Status429TooManyRequests;

                httpContext.Response.ContentType =
                    "application/json";

                httpContext.Response.Headers.RetryAfter =
                    retryAfter.ToString();

                var response = new
                {
                    success = false,

                    message =
                        $"Too many requests. Please try again in {retryAfter} seconds.",

                    retryAfterSeconds = retryAfter,

                    retryAfterUtc =
                        DateTime.UtcNow.AddSeconds(retryAfter)
                };

                await httpContext.Response.WriteAsJsonAsync(
                    response,
                    cancellationToken);
            };


            // ============================================
            // Auth Limiter
            // Anonymous users → Per IP
            // ============================================

            options.AddPolicy("AuthLimiter", httpContext =>
            {
                var ip =
                    httpContext.Connection.RemoteIpAddress?.ToString()
                    ?? "unknown";

                return RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: $"ip:{ip}",

                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 5,

                        Window = WindowDuration,

                        QueueLimit = 0,

                        AutoReplenishment = true
                    });
            });


            // ============================================
            // User Limiter
            // Authenticated users → Per User
            // ============================================

            options.AddPolicy("UserLimiter", httpContext =>
            {
                var userId =
                    httpContext.User.FindFirstValue(
                        ClaimTypes.NameIdentifier);

                // No authenticated user
                if (string.IsNullOrWhiteSpace(userId))
                {
                    return RateLimitPartition.GetFixedWindowLimiter(
                        "anonymous",

                        _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = 5,

                            Window = WindowDuration,

                            QueueLimit = 0,

                            AutoReplenishment = true
                        });
                }

                // Authenticated user
                return RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: $"user:{userId}",

                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 60,

                        Window = WindowDuration,

                        QueueLimit = 0,

                        AutoReplenishment = true
                    });
            });
        });

        return services;
    }
}
/*
```

** مهم:** أضف الـ `using` ده لو الـ `EnableRateLimitingAttribute` مش متشاف عندك:

```csharp
using Microsoft.AspNetCore.RateLimiting;
```

### دلوقتي الصورة عندك بقت كده

لو حد ضرب Login أكثر من 5 مرات في الدقيقة:

```text
Request 1 → allowed
Request 2 → allowed
Request 3 → allowed
Request 4 → allowed
Request 5 → allowed
Request 6 → 429 + Warning Log
Request 7 → 429 + Warning Log
...
```

والـ Log هيبقى مثلًا:

```text
Warning:
Rate limit exceeded.
Policy: AuthLimiter
UserId: anonymous
IP: 192.168.1.10
Endpoint: /api/auth/login
RetryAfter: 47s
```

وده** مفيد أمنيًا جدًا** لأنك دلوقتي عندك:

`Rate Limiter` → يمنع الـ abuse

`Warning Log` → يسجل إن الـ limit اتضرب

`Refresh Token Logs` → يسجل الأحداث الأمنية المهمة داخل الـ authentication

وبالتالي أنت مش بتعمل Logging لكل Request؛ **بتسجل الأحداث اللي تستحق المراقبة فقط**.
*/