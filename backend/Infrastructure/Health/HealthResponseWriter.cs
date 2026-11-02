using System.Text.Json;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace PIM_III_Backend.Infrastructure.Health;

public static class HealthResponseWriter
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public static Task WriteAsync(HttpContext context, HealthReport report)
    {
        context.Response.ContentType = "application/json";
        var body = new
        {
            status = report.Status.ToString(),
            totalDurationMs = Math.Round(report.TotalDuration.TotalMilliseconds, 1),
            timestamp = DateTime.UtcNow,
            checks = report.Entries.ToDictionary(
                entry => entry.Key,
                entry => new
                {
                    status = entry.Value.Status.ToString(),
                    description = entry.Value.Description,
                    durationMs = Math.Round(entry.Value.Duration.TotalMilliseconds, 1)
                })
        };
        return context.Response.WriteAsync(JsonSerializer.Serialize(body, Json));
    }
}
