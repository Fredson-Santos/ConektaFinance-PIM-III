using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace PIM_III_Backend.Infrastructure.Health;

// Canal WhatsApp opcional: fora do ar deixa a API "Degraded", nunca "Unhealthy",
// porque web e PWA continuam funcionando sem ele.
public class EvolutionHealthCheck(IConfiguration configuration, IHttpClientFactory httpClientFactory) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        var baseUrl = configuration["Evolution:BaseUrl"];
        if (string.IsNullOrWhiteSpace(baseUrl))
            return HealthCheckResult.Healthy("Canal WhatsApp nao configurado neste ambiente.");

        try
        {
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeout.CancelAfter(TimeSpan.FromSeconds(3));
            var client = httpClientFactory.CreateClient(nameof(EvolutionHealthCheck));
            using var response = await client.GetAsync(baseUrl, timeout.Token);
            return (int)response.StatusCode < 500
                ? HealthCheckResult.Healthy("Evolution API respondendo.")
                : HealthCheckResult.Degraded($"Evolution API retornou {(int)response.StatusCode}.");
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            return HealthCheckResult.Degraded("Evolution API indisponivel.");
        }
    }
}
