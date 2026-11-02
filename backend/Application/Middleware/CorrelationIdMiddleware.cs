using System.Text.RegularExpressions;
using Serilog.Context;

namespace PIM_III_Backend.Application.Middleware;

// Identificador de correlacao por requisicao: reaproveita o X-Correlation-Id
// enviado pelo cliente (se valido) ou gera um novo; volta no cabecalho da
// resposta, no ProblemDetails de erro e em todas as linhas de log.
public partial class CorrelationIdMiddleware(RequestDelegate next)
{
    public const string HeaderName = "X-Correlation-Id";

    public async Task InvokeAsync(HttpContext context)
    {
        var incoming = context.Request.Headers[HeaderName].ToString();
        var correlationId = ValidId().IsMatch(incoming) ? incoming : Guid.NewGuid().ToString("N");
        context.TraceIdentifier = correlationId;
        context.Response.OnStarting(() =>
        {
            context.Response.Headers[HeaderName] = correlationId;
            return Task.CompletedTask;
        });

        using (LogContext.PushProperty("CorrelationId", correlationId))
            await next(context);
    }

    [GeneratedRegex("^[A-Za-z0-9-]{8,64}$")]
    private static partial Regex ValidId();
}
