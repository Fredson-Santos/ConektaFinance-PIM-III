using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using PIM_III_Backend.Application.Dtos;
using Xunit;

namespace PIM_III_Backend.Tests.Integration;

public class AlertsFlowTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    private static readonly System.Text.Json.JsonSerializerOptions Json = TestJson.Options;
    private readonly HttpClient _client = factory.CreateClient();

    private async Task<HttpClient> CreateUserClientAsync()
    {
        var email = $"{Guid.NewGuid():N}@conekta.teste";
        var register = await _client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest("Usuario Alertas", email, "SenhaForte@123", null, null));
        var auth = await register.Content.ReadFromJsonAsync<AuthResponse>(Json);
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
        return client;
    }

    private static object NewExpense(int categoryId, decimal value) => new
    {
        type = "expense",
        categoryId,
        description = "Gasto teste",
        value,
        transactionDate = DateTime.UtcNow.AddDays(-1).ToString("yyyy-MM-dd"),
        paymentMethod = "pix"
    };

    [Fact]
    public async Task Gasto_proximo_do_teto_gera_alerta_de_atencao_sem_duplicar()
    {
        var client = await CreateUserClientAsync();
        var categories = await (await client.GetAsync("/api/v1/categories?kind=expense")).Content
            .ReadFromJsonAsync<List<CategoryResponse>>(Json);
        var lazer = categories!.First(c => c.Name == "Lazer");
        var now = DateTime.UtcNow;
        await client.PutAsJsonAsync("/api/v1/budgets",
            new { categoryId = lazer.Id, limitValue = 100m, month = now.Month, year = now.Year });

        await client.PostAsJsonAsync("/api/v1/transactions", NewExpense(lazer.Id, 90m));
        await client.PostAsJsonAsync("/api/v1/transactions", NewExpense(lazer.Id, 5m));

        var alerts = await (await client.GetAsync("/api/v1/alerts")).Content
            .ReadFromJsonAsync<List<AlertResponse>>(Json);
        var warn = alerts!.Should().ContainSingle(a => a.Type == "categoryLimit").Subject;
        warn.Title.Should().Contain("Lazer");
        warn.Message.Should().Contain("Restam");

        var count = await (await client.GetAsync("/api/v1/alerts/unread-count")).Content
            .ReadFromJsonAsync<UnreadCountResponse>(Json);
        count!.Count.Should().Be(1);
    }

    [Fact]
    public async Task Gasto_acima_do_teto_gera_alerta_de_estouro_e_substitui_o_de_atencao()
    {
        var client = await CreateUserClientAsync();
        var categories = await (await client.GetAsync("/api/v1/categories?kind=expense")).Content
            .ReadFromJsonAsync<List<CategoryResponse>>(Json);
        var alimentacao = categories!.First(c => c.Name == "Alimentação");
        var now = DateTime.UtcNow;
        await client.PutAsJsonAsync("/api/v1/budgets",
            new { categoryId = alimentacao.Id, limitValue = 100m, month = now.Month, year = now.Year });

        await client.PostAsJsonAsync("/api/v1/transactions", NewExpense(alimentacao.Id, 150m));

        var alerts = await (await client.GetAsync("/api/v1/alerts")).Content
            .ReadFromJsonAsync<List<AlertResponse>>(Json);
        alerts!.Should().ContainSingle(a => a.Type == "budgetExceeded")
            .Which.Message.Should().Contain("Orcamento excedido");
        alerts.Should().NotContain(a => a.Type == "categoryLimit");
    }

    [Fact]
    public async Task Marcar_como_lida_e_dispensar_alerta_do_proprio_usuario()
    {
        var client = await CreateUserClientAsync();
        var categories = await (await client.GetAsync("/api/v1/categories?kind=expense")).Content
            .ReadFromJsonAsync<List<CategoryResponse>>(Json);
        var transporte = categories!.First(c => c.Name == "Transporte");
        var now = DateTime.UtcNow;
        await client.PutAsJsonAsync("/api/v1/budgets",
            new { categoryId = transporte.Id, limitValue = 100m, month = now.Month, year = now.Year });
        await client.PostAsJsonAsync("/api/v1/transactions", NewExpense(transporte.Id, 85m));
        var alerts = await (await client.GetAsync("/api/v1/alerts")).Content
            .ReadFromJsonAsync<List<AlertResponse>>(Json);
        var alert = alerts!.First();

        var read = await client.PutAsync($"/api/v1/alerts/{alert.Id}/read", null);
        read.StatusCode.Should().Be(HttpStatusCode.NoContent);
        var unread = await (await client.GetAsync("/api/v1/alerts/unread-count")).Content
            .ReadFromJsonAsync<UnreadCountResponse>(Json);
        unread!.Count.Should().Be(0);
        var unreadOnly = await (await client.GetAsync("/api/v1/alerts?unreadOnly=true")).Content
            .ReadFromJsonAsync<List<AlertResponse>>(Json);
        unreadOnly!.Should().BeEmpty();

        var dismiss = await client.DeleteAsync($"/api/v1/alerts/{alert.Id}");
        dismiss.StatusCode.Should().Be(HttpStatusCode.NoContent);
        var remaining = await (await client.GetAsync("/api/v1/alerts")).Content
            .ReadFromJsonAsync<List<AlertResponse>>(Json);
        remaining!.Should().BeEmpty();
    }

    [Fact]
    public async Task Dispensar_alerta_de_outro_usuario_retorna_404()
    {
        var (clientA, categories) = await Task.Run(async () =>
        {
            var client = await CreateUserClientAsync();
            var cats = await (await client.GetAsync("/api/v1/categories?kind=expense")).Content
                .ReadFromJsonAsync<List<CategoryResponse>>(Json);
            return (client, cats!);
        });
        var lazer = categories.First(c => c.Name == "Lazer");
        var now = DateTime.UtcNow;
        await clientA.PutAsJsonAsync("/api/v1/budgets",
            new { categoryId = lazer.Id, limitValue = 100m, month = now.Month, year = now.Year });
        await clientA.PostAsJsonAsync("/api/v1/transactions", NewExpense(lazer.Id, 95m));
        var alerts = await (await clientA.GetAsync("/api/v1/alerts")).Content
            .ReadFromJsonAsync<List<AlertResponse>>(Json);

        var clientB = await CreateUserClientAsync();
        var response = await clientB.DeleteAsync($"/api/v1/alerts/{alerts!.First().Id}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
