using System.Net;
using System.Text.Json;
using Business.DTOs.Common;
using Business.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, errors) = exception switch
        {
            NotFoundException => (HttpStatusCode.NotFound, (IEnumerable<string>?)null),
            BadRequestException bre => (HttpStatusCode.BadRequest,
                                        bre.Errors?.Any() == true ? bre.Errors : null),
            UnauthorizedException => (HttpStatusCode.Unauthorized, null),
            ForbiddenException => (HttpStatusCode.Forbidden, null),
            OperationCanceledException
                                     => (HttpStatusCode.RequestTimeout,
                                         (IEnumerable<string>?)new[] { "Request was cancelled." }),
            DbUpdateException => (HttpStatusCode.Conflict,
                                         (IEnumerable<string>?)new[] { "Database conflict occurred." }),
            _ => (HttpStatusCode.InternalServerError,
                                         (IEnumerable<string>?)new[] { "An unexpected error occurred." })
        };

        var isServerError = (int)statusCode >= 500;
        var clientMessage = isServerError
            ? "An unexpected error occurred. Please try again later."
            : exception.Message;

        var response = ApiResponseDto<object>.Fail(clientMessage, errors);

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;
        context.Response.Headers["X-Trace-Id"] = context.TraceIdentifier;

        var json = JsonSerializer.Serialize(response,
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        await context.Response.WriteAsync(json);
    }
}