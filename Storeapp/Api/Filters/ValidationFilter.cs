using Business.DTOs.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace API.Filters;

/// <summary>
/// Global filter that intercepts model validation failures
/// and returns a standardized API response.
/// 
/// NOTE: This filter is OPTIONAL if you're using FluentValidation's
/// auto-validation. It's useful when you want a consistent error shape
/// across both DataAnnotations and FluentValidation failures.
/// </summary>
public class ValidationFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        if (!context.ModelState.IsValid)
        {
            var errors = context.ModelState
                .Where(kv => kv.Value?.Errors.Count > 0)
                .SelectMany(kv => kv.Value!.Errors
                    .Select(e => string.IsNullOrWhiteSpace(e.ErrorMessage)
                        ? $"{kv.Key}: Invalid value."
                        : e.ErrorMessage))
                .ToList();

            var response = ApiResponseDto<object>.Fail("Validation failed.", errors);

            context.Result = new BadRequestObjectResult(response);
        }
    }

    public void OnActionExecuted(ActionExecutedContext context) { }
}