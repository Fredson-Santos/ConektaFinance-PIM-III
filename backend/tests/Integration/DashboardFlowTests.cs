using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Domain.Enums;
using Xunit;

namespace PIM_III_Backend.Tests.Integration;

public class DashboardFlowTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    private static readonly System.Text.Json.JsonSerializerOptions Json = TestJson.Options;
    private readonly HttpClient _client = factory.CreateClient();

    private async Task<HttpClient> CreateUserClientAsync()
    {
        var email = $"{Guid.NewGuid():N}@conekta.teste";
        var register = await _client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest("Usuario Dashboard", email, "SenhaForte@123", null, 1000m));
        var auth = await register.Content.ReadFromJsonAsync<AuthResponse>(Json);
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
        return client;
    }

    private static object NewTransaction(string type, int categoryId, string description, decimal value, int daysAgo) => new
    {
        type,
        categoryId,
        description,
        value,
        transactionDate = DateTime.UtcNow.AddDays(-daysAgo).ToString("yyyy-MM-dd"),
        paymentMethod = "pix"
    };

    [Fact]
    public async Task Overview_reflete_lancamentos_criados_e_percentual_do_teto()
    {
        var client = await CreateUserClientAsync();
        var categories = await (await client.GetAsync("/api/v1/categories?kind=income")).Content
            .ReadFromJsonAsync<List<CategoryResponse>>(Json);
        var salario = categories!.First().Id;
        var expenseCategories = await (await client.GetAsync("/api/v1/categories?kind=expense")).Content
            .ReadFromJsonAsync<List<CategoryResponse>>(Json);
        var alimentacao = expenseCategories!.First().Id;

        await client.PostAsJsonAsync("/api/v1/transactions", NewTransaction("income", salario, "Salario", 5000m, 1));
        await client.PostAsJsonAsync("/api/v1/transactions", NewTransaction("expense", alimentacao, "Mercado", 1200m, 0));

        var overview = await (await client.GetAsync("/api/v1/dashboard/overview")).Content
            .ReadFromJsonAsync<DashboardOverviewResponse>(Json);

        overview!.Income.Should().Be(5000m);
        overview.Expense.Should().Be(1200m);
        overview.Balance.Should().Be(3800m);
        overview.ExpenseToCeilingPercentage.Should().Be(120);
        overview.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(5));
    }

    [Fact]
    public async Task Semana_retorna_sete_dias_e_total_dos_gastos_recentes()
    {
        var client = await CreateUserClientAsync();
        var categories = await (await client.GetAsync("/api/v1/categories?kind=expense")).Content
            .ReadFromJsonAsync<List<CategoryResponse>>(Json);
        var alimentacao = categories!.First().Id;
        await client.PostAsJsonAsync("/api/v1/transactions", NewTransaction("expense", alimentacao, "Cafe", 58m, 0));

        var week = await (await client.GetAsync("/api/v1/dashboard/weekly-expenses")).Content
            .ReadFromJsonAsync<WeeklyExpensesResponse>(Json);

        week!.Days.Should().HaveCount(7);
        week.Total.Should().Be(58m);
        week.Days.First(d => d.Value == 58m).Percentage.Should().Be(100);
    }

    [Fact]
    public async Task Lancamentos_recentes_retornam_ordenados_por_data()
    {
        var client = await CreateUserClientAsync();
        var expenseCategories = await (await client.GetAsync("/api/v1/categories?kind=expense")).Content
            .ReadFromJsonAsync<List<CategoryResponse>>(Json);
        var alimentacao = expenseCategories!.First().Id;
        await client.PostAsJsonAsync("/api/v1/transactions", NewTransaction("expense", alimentacao, "Antigo", 10m, 3));
        await client.PostAsJsonAsync("/api/v1/transactions", NewTransaction("expense", alimentacao, "Recente", 20m, 0));

        var recent = await (await client.GetAsync("/api/v1/dashboard/recent-transactions?limit=5")).Content
            .ReadFromJsonAsync<List<TransactionResponse>>(Json);

        recent!.Should().HaveCount(2);
        recent[0].Description.Should().Be("Recente");
        recent[0].Category.Name.Should().Be("Alimentação");
    }

    [Fact]
    public async Task Medidores_do_dashboard_exibem_categoria_com_teto()
    {
        var client = await CreateUserClientAsync();
        var expenseCategories = await (await client.GetAsync("/api/v1/categories?kind=expense")).Content
            .ReadFromJsonAsync<List<CategoryResponse>>(Json);
        var transporte = expenseCategories!.First(c => c.Name == "Transporte");
        var now = DateTime.UtcNow;
        await client.PutAsJsonAsync("/api/v1/budgets",
            new { categoryId = transporte.Id, limitValue = 400m, month = now.Month, year = now.Year });
        await client.PostAsJsonAsync("/api/v1/transactions", NewTransaction("expense", transporte.Id, "Uber", 200m, 0));

        var meters = await (await client.GetAsync("/api/v1/dashboard/budget-meters")).Content
            .ReadFromJsonAsync<List<BudgetMeterResponse>>(Json);

        var meter = meters!.Should().ContainSingle(m => m.Name == "Transporte").Subject;
        meter.Spent.Should().Be(200m);
        meter.Percentage.Should().Be(50);
    }

    [Fact]
    public async Task Endpoints_do_dashboard_exigem_autenticacao()
    {
        var response = await _client.GetAsync("/api/v1/dashboard/overview");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
