using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Domain.Enums;
using Xunit;

namespace PIM_III_Backend.Tests.Integration;

public class BudgetsFlowTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    private static readonly System.Text.Json.JsonSerializerOptions Json = TestJson.Options;
    private readonly HttpClient _client = factory.CreateClient();

    private async Task<(HttpClient client, List<CategoryResponse> categories)> CreateUserWithCategoriesAsync()
    {
        var email = $"{Guid.NewGuid():N}@conekta.teste";
        var register = await _client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest("Usuario Orcamentos", email, "SenhaForte@123", null, null));
        var auth = await register.Content.ReadFromJsonAsync<AuthResponse>(Json);
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
        var categories = await (await client.GetAsync("/api/v1/categories")).Content
            .ReadFromJsonAsync<List<CategoryResponse>>(Json);
        return (client, categories!);
    }

    [Fact]
    public async Task Upsert_de_teto_e_idempotente_e_lista_com_status()
    {
        var (client, categories) = await CreateUserWithCategoriesAsync();
        var alimentacao = categories.First(c => c.Kind == CategoryKind.Expense);
        var now = DateTime.UtcNow;
        var payload = new { categoryId = alimentacao.Id, limitValue = 1000m, month = now.Month, year = now.Year };

        var first = await client.PutAsJsonAsync("/api/v1/budgets", payload);
        first.StatusCode.Should().Be(HttpStatusCode.OK);
        var second = await client.PutAsJsonAsync("/api/v1/budgets", payload with { limitValue = 1500m });
        second.StatusCode.Should().Be(HttpStatusCode.OK);

        var list = await (await client.GetAsync($"/api/v1/budgets?month={now.Month}&year={now.Year}"))
            .Content.ReadFromJsonAsync<List<BudgetResponse>>(Json);
        var item = list.Should().ContainSingle(b => b.CategoryId == alimentacao.Id).Subject;
        item.LimitValue.Should().Be(1500m);
        item.Spent.Should().Be(0m);
        item.Status.Should().Be("ok");
    }

    [Fact]
    public async Task Upsert_em_categoria_de_entrada_retorna_400()
    {
        var (client, categories) = await CreateUserWithCategoriesAsync();
        var salario = categories.First(c => c.Kind == CategoryKind.Income);
        var now = DateTime.UtcNow;

        var response = await client.PutAsJsonAsync("/api/v1/budgets",
            new { categoryId = salario.Id, limitValue = 100m, month = now.Month, year = now.Year });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Gasto_acima_do_teto_aparece_como_estourado()
    {
        var (client, categories) = await CreateUserWithCategoriesAsync();
        var lazer = categories.First(c => c.Kind == CategoryKind.Expense && c.Name == "Lazer");
        var now = DateTime.UtcNow;
        await client.PutAsJsonAsync("/api/v1/budgets",
            new { categoryId = lazer.Id, limitValue = 100m, month = now.Month, year = now.Year });
        await client.PostAsJsonAsync("/api/v1/transactions", new
        {
            type = "expense",
            categoryId = lazer.Id,
            description = "Cinema",
            value = 150m,
            transactionDate = DateTime.UtcNow.AddDays(-1).ToString("yyyy-MM-dd"),
            paymentMethod = "pix"
        });

        var list = await (await client.GetAsync($"/api/v1/budgets?month={now.Month}&year={now.Year}"))
            .Content.ReadFromJsonAsync<List<BudgetResponse>>(Json);

        var item = list.Should().ContainSingle(b => b.CategoryId == lazer.Id).Subject;
        item.Status.Should().Be("over");
        item.PercentageUsed.Should().Be(150);
    }
}
