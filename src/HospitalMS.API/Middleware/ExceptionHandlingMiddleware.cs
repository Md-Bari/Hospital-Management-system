using System.Net;
using System.Text.Json;
using HospitalMS.Application.Common.Exceptions;

namespace HospitalMS.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
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
            _logger.LogError(ex, "An unhandled exception occurred during request execution: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var code = HttpStatusCode.InternalServerError;
        object response;

        switch (exception)
        {
            case ValidationException validationException:
                code = HttpStatusCode.BadRequest;
                response = new
                {
                    success = false,
                    error = "Validation failed.",
                    code = "VALIDATION_ERROR",
                    validationErrors = validationException.Errors
                };
                break;

            case NotFoundException notFoundException:
                code = HttpStatusCode.NotFound;
                response = new
                {
                    success = false,
                    error = notFoundException.Message,
                    code = "NOT_FOUND"
                };
                break;

            case UnauthorizedAccessException:
                code = HttpStatusCode.Unauthorized;
                response = new
                {
                    success = false,
                    error = "Unauthorized access.",
                    code = "UNAUTHORIZED"
                };
                break;

            default:
                response = new
                {
                    success = false,
                    error = "An unexpected server error occurred. Please contact hospital system administration.",
                    code = "INTERNAL_SERVER_ERROR"
                };
                break;
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)code;

        var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        return context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
    }
}

