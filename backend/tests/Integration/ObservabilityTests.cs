using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using PIM_III_Backend.Application.Dtos;
using Xunit;

namespace PIM_III_Backend.Tests.Integration;

public class ObservabilityTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    private static readonly JsonSerializerOptions Json = TestJson.Options;
    private const string Header = "X-Correlation-Id";

    [Fact]
    public async Task Toda_resposta_traz_correlation_id_gerado_pela_api()
    {
        var response = await factory.CreateClient().GetAsync("/health");

        response.Headers.GetValues(Header).Single().Should().MatchRegex("^[a-f0-9]{32}$");
    }

    [Fact]
    public async Task Correlation_id_valido_do_cliente_e_propagado_e_invalido_e_substituido()
    {
        var client = factory.CreateClient();
        var valido = new HttpRequestMessage(HttpMethod.Get, "/health");
        valido.Headers.Add(Header, "pedido-123-abc");
        var invalido = new HttpRequestMessage(HttpMethod.Get, "/health");
        invalido.Headers.Add(Header, "<script>alert(1)</script>");

        var propagado = await client.SendAsync(valido);
        var substituido = await client.SendAsync(invalido);

        propagado.Headers.GetValues(Header).Single().Should().Be("pedido-123-abc");
        substituido.Headers.GetValues(Header).Single().Should().MatchRegex("^[a-f0-9]{32}$");
    }

    [Fact]
    public async Task Erro_traz_correlation_id_no_problem_details_e_mantem_cabecalhos_de_seguranca()
    {
        var client = factory.CreateClient();
        var register = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest("Usuario Logs", $"{Guid.NewGuid():N}@conekta.teste", "SenhaForte@123", null, null));
        var auth = await register.Content.ReadFromJsonAsync<AuthResponse>(Json);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);

        var response = await client.GetAsync("/api/v1/transactions/999999");
        using var problem = JsonDocument.Parse(await response.Content.ReadAsStringAsync());

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        problem.RootElement.GetProperty("correlationId").GetString()
            .Should().Be(response.Headers.GetValues(Header).Single());
        response.Headers.GetValues("X-Content-Type-Options").Should().ContainSingle("nosniff");
        response.Headers.Contains("Content-Security-Policy").Should().BeTrue();
    }

    [Fact]
    public async Task Health_live_e_ready_informam_o_estado_das_dependencias()
    {
        var client = factory.CreateClient();

        var live = await client.GetAsync("/health/live");
        var ready = await client.GetAsync("/health/ready");
        using var body = JsonDocument.Parse(await ready.Content.ReadAsStringAsync());

        live.StatusCode.Should().Be(HttpStatusCode.OK);
        ready.StatusCode.Should().Be(HttpStatusCode.OK);
        body.RootElement.GetProperty("status").GetString().Should().Be("Healthy");
        var checks = body.RootElement.GetProperty("checks");
        checks.GetProperty("database").GetProperty("status").GetString().Should().Be("Healthy");
        checks.GetProperty("whatsapp").GetProperty("status").GetString().Should().Be("Healthy");
    }

    [Fact]
    public async Task Health_ready_retorna_503_quando_uma_dependencia_esta_fora()
    {
        var client = factory.WithWebHostBuilder(builder => builder.ConfigureServices(services =>
                services.AddHealthChecks().AddCheck("banco-simulado-fora",
                    () => HealthCheckResult.Unhealthy("Sem conexao"), tags: ["ready"])))
            .CreateClient();

        var ready = await client.GetAsync("/health/ready");
        var live = await client.GetAsync("/health/live");

        ready.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
        live.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
