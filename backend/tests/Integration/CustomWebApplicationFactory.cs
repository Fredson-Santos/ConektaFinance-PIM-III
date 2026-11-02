using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using PIM_III_Backend.Application.Services;
using PIM_III_Backend.Infrastructure.Copilot;
using PIM_III_Backend.Infrastructure.Messaging;
using PIM_III_Backend.Infrastructure.Persistence;

namespace PIM_III_Backend.Tests.Integration;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    public const string AdminEmail = "admin@conekta.teste";
    public const string AdminPassword = "AdminForte@123";

    private readonly string _connectionString = PostgresTestServer.CreateDatabaseAsync().GetAwaiter().GetResult();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseSetting("Storage:UploadsPath",
            Path.Combine(Path.GetTempPath(), "conekta-test-uploads"));
        builder.UseSetting("RateLimit:AuthPermitLimit", "10000");
        builder.UseSetting("RateLimit:AuthWindowSeconds", "60");
        builder.UseSetting("ConnectionStrings:DefaultConnection", _connectionString);
        builder.UseSetting("Admin:Email", AdminEmail);
        builder.UseSetting("Admin:Password", AdminPassword);
        builder.ConfigureServices(services =>
        {
            // Regra tests.md: a IA e sempre simulada na suíte — nem user secrets
            // locais do dev podem ligar o LLM real nos testes de integracao.
            var copilotDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(ICopilotAiClient));
            if (copilotDescriptor is not null)
                services.Remove(copilotDescriptor);
            services.AddScoped<ICopilotAiClient>(sp => new CompositeCopilotClient(
                null,
                new RuleBasedCopilotClient(),
                sp.GetRequiredService<ILogger<CompositeCopilotClient>>()));

            // Regra tests.md: servicos externos (Evolution API / WhatsApp) sempre mockados nos testes
            var otpDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IOtpSender));
            if (otpDescriptor is not null)
                services.Remove(otpDescriptor);
            services.AddScoped<IOtpSender, DevOtpSender>();
        });
    }
}
