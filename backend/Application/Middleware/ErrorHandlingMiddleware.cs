using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using PIM_III_Backend.Application.Exceptions;

namespace PIM_III_Backend.Application.Middleware;

public class ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (AppException ex)
        {
            await WriteProblemAsync(context, ex.StatusCode, ex.Title, ex.Detail, ex.Errors);
        }
        catch (UnauthorizedAccessException)
        {
            await WriteProblemAsync(context, StatusCodes.Status403Forbidden, "Acesso negado",
                "Você não tem permissão para acessar este recurso.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Erro nao tratado em {Path}", context.Request.Path);
            await WriteProblemAsync(context, StatusCodes.Status500InternalServerError, "Erro interno",
                "Ocorreu um erro inesperado. Tente novamente em instantes.");
        }
    }

    private static async Task WriteProblemAsync(HttpContext context, int statusCode, string title, string detail,
        IDictionary<string, string[]>? errors = null)
    {
        if (context.Response.HasStarted)
            return;
        context.Response.Clear();
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";
        var problem = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Instance = context.Request.Path
        };
        if (errors is { Count: > 0 })
            problem.Extensions["errors"] = errors;
        await context.Response.WriteAsync(JsonSerializer.Serialize(problem));
    }
}
