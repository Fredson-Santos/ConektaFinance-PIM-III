using System.Text.Json;
using FluentAssertions;
using Xunit;

namespace PIM_III_Backend.Tests.Integration;

// Garante que todo endpoint publicado no Swagger tem descricao, tag e codigos de erro.
public class SwaggerDocumentationTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    private static readonly string[] Methods = ["get", "post", "put", "patch", "delete"];

    [Fact]
    public async Task Todos_os_endpoints_tem_resumo_tag_e_respostas_de_erro()
    {
        var json = await factory.CreateClient().GetStringAsync("/swagger/v1/swagger.json");
        using var document = JsonDocument.Parse(json);

        var problemas = new List<string>();
        var total = 0;
        foreach (var path in document.RootElement.GetProperty("paths").EnumerateObject())
        foreach (var operation in path.Value.EnumerateObject().Where(o => Methods.Contains(o.Name)))
        {
            total++;
            var id = $"{operation.Name.ToUpperInvariant()} {path.Name}";
            if (!operation.Value.TryGetProperty("summary", out var summary) || string.IsNullOrWhiteSpace(summary.GetString()))
                problemas.Add($"{id}: sem summary");
            if (!operation.Value.TryGetProperty("tags", out _))
                problemas.Add($"{id}: sem tag");
            var responses = operation.Value.GetProperty("responses").EnumerateObject().Select(r => r.Name).ToList();
            if (!responses.Any(code => code.StartsWith('2')))
                problemas.Add($"{id}: sem resposta de sucesso");
            // Health checks nao tem erro de cliente possivel.
            if (!path.Name.StartsWith("/health") && !responses.Any(code => code.StartsWith('4')))
                problemas.Add($"{id}: sem respostas de erro");
        }

        total.Should().BeGreaterThanOrEqualTo(50);
        problemas.Should().BeEmpty();
    }

    [Fact]
    public async Task Resposta_de_sucesso_mantem_o_schema_do_dto()
    {
        var json = await factory.CreateClient().GetStringAsync("/swagger/v1/swagger.json");
        using var document = JsonDocument.Parse(json);

        var schema = document.RootElement.GetProperty("paths").GetProperty("/api/v1/Admin/metrics")
            .GetProperty("get").GetProperty("responses").GetProperty("200")
            .GetProperty("content").GetProperty("application/json").GetProperty("schema");

        schema.GetProperty("$ref").GetString().Should().EndWith("AdminMetricsResponse");
    }
}
