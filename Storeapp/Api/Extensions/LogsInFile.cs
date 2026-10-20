using Serilog;
using Serilog.Events;

namespace Api.Extensions;

public static class LogsInFile
{
    private const string LogFilePath = "Logs/app-.log";

    public static WebApplicationBuilder AddApplicationLogging(
        this WebApplicationBuilder builder)
    {
        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Information()

            // Reduce unnecessary ASP.NET Core logs
            .MinimumLevel.Override(
                "Microsoft",
                LogEventLevel.Warning)

            .MinimumLevel.Override(
                "Microsoft.AspNetCore",
                LogEventLevel.Warning)

            // Console
            .WriteTo.Console()

            // File
            .WriteTo.File(
                path: LogFilePath,
                fileSizeLimitBytes: 10 * 1024 * 1024,
                rollOnFileSizeLimit: true,
                retainedFileCountLimit: 30,
                shared: true,
                outputTemplate:
                    "[{Timestamp:yyyy-MM-dd HH:mm:ss.fff} " +
                    "{Level:u3}] " +
                    "{SourceContext} - " +
                    "{Message:lj}{NewLine}{Exception}"
            )

            .CreateLogger();

        builder.Host.UseSerilog();

        return builder;
    }
}