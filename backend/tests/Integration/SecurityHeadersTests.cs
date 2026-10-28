using FluentAssertions;
using Xunit;

namespace PIM_III_Backend.Tests.Integration;

public class SecurityHeadersTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Theory]
    [InlineData("/health")]
    [InlineData("/api/v1/dashboard/overview")]
    public async Task Respostas_da_api_trazem_cabecalhos_de_seguranca(string path)
    {
        var response = await _client.GetAsync(path);

        response.Headers.GetValues("X-Content-Type-Options").Should().ContainSingle("nosniff");
        response.Headers.GetValues("X-Frame-Options").Should().ContainSingle("DENY");
        response.Headers.GetValues("Referrer-Policy").Should().ContainSingle("strict-origin-when-cross-origin");
        response.Headers.Contains("Permissions-Policy").Should().BeTrue();
        response.Headers.GetValues("Content-Security-Policy").Should().ContainSingle("default-src 'none'; frame-ancestors 'none'");
    }

    [Fact]
    public async Task Interface_do_swagger_nao_recebe_csp_restritiva()
    {
        var response = await _client.GetAsync("/swagger/index.html");

        response.Headers.Contains("Content-Security-Policy").Should().BeFalse();
        response.Headers.GetValues("X-Content-Type-Options").Should().ContainSingle("nosniff");
    }
}
