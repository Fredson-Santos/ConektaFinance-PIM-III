using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using PIM_III_Backend.Application.Dtos;
using Xunit;

namespace PIM_III_Backend.Tests.Integration;

public class ReportsFlowTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    private static readonly System.Text.Json.JsonSerializerOptions Json = TestJson.Options;
    private readonly HttpClient _client = factory.CreateClient();

    private async Task<HttpClient> CreateUserClientAsync()
    {
        var email = $"{Guid.NewGuid():N}@conekta.teste";
        var register = await _client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest("Usuario Relatorios", email, "SenhaForte@123", null, null));
        var auth = await register.Content.ReadFromJsonAsync<AuthResponse>(Json);
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
        return client;
    }

    private static object NewTransaction(string type, int categoryId, string description, decimal value, DateTime date) => new
    {
        type,
        categoryId,
        description,
        value,
        transactionDate = date.ToString("yyyy-MM-dd"),
        paymentMethod = "pix"
    };

    [Fact]
    public async Task Resumo_do_periodo_reflete_lancamentos_do_mes()
    {
        var client = await CreateUserClientAsync();
        var categories = await (await client.GetAsync("/api/v1/categories")).Content
            .ReadFromJsonAsync<List<CategoryResponse>>(Json);
        var salario = categories!.First(c => c.Kind == Domain.Enums.CategoryKind.Income).Id;
        var alimentacao = categories.First(c => c.Name == "Alimentação").Id;
        var moradia = categories.First(c => c.Name == "Moradia").Id;
        var now = DateTime.UtcNow;
        var periodStart = new DateTime(now.Year, now.Month, 1);
        var periodEnd = periodStart.AddMonths(1);
        await client.PostAsJsonAsync("/api/v1/transactions", NewTransaction("income", salario, "Salario", 5000m, periodStart.AddDays(4)));
        await client.PostAsJsonAsync("/api/v1/transactions", NewTransaction("expense", alimentacao, "Mercado", 450m, now.AddDays(-3)));
        await client.PostAsJsonAsync("/api/v1/transactions", NewTransaction("expense", moradia, "Aluguel", 1200m, periodStart.AddDays(7)));

        var summary = await (await client.GetAsync($"/api/v1/reports/summary?start={periodStart:yyyy-MM-dd}&end={periodEnd:yyyy-MM-dd}"))
            .Content.ReadFromJsonAsync<ReportSummaryResponse>(Json);

        summary!.TotalIncome.Should().Be(5000m);
        summary.TotalExpense.Should().Be(1650m);
        summary.Balance.Should().Be(3350m);
        summary.SavingsRate.Should().Be(67);
        summary.LargestExpense!.Description.Should().Be("Aluguel");
        summary.LargestExpense.Amount.Should().Be(1200m);
    }

    [Fact]
    public async Task Por_categoria_ordena_por_total_e_calcula_percentual()
    {
        var client = await CreateUserClientAsync();
        var categories = await (await client.GetAsync("/api/v1/categories?kind=expense")).Content
            .ReadFromJsonAsync<List<CategoryResponse>>(Json);
        var alimentacao = categories!.First(c => c.Name == "Alimentação").Id;
        var transporte = categories.First(c => c.Name == "Transporte").Id;
        await client.PostAsJsonAsync("/api/v1/transactions", NewTransaction("expense", alimentacao, "Mercado", 300m, DateTime.UtcNow.AddDays(-1)));
        await client.PostAsJsonAsync("/api/v1/transactions", NewTransaction("expense", transporte, "Uber", 100m, DateTime.UtcNow.AddDays(-2)));

        var byCategory = await (await client.GetAsync("/api/v1/reports/by-category")).Content
            .ReadFromJsonAsync<List<CategoryReportResponse>>(Json);

        byCategory!.First().Name.Should().Be("Alimentação");
        byCategory.First().Percentage.Should().Be(75);
        byCategory.Should().ContainSingle(c => c.Name == "Transporte").Which.Percentage.Should().Be(25);
    }

    [Fact]
    public async Task Tendencia_retorna_seis_meses_do_contexto_do_usuario()
    {
        var client = await CreateUserClientAsync();

        var trend = await (await client.GetAsync("/api/v1/reports/trend?months=6")).Content
            .ReadFromJsonAsync<List<TrendReportResponse>>(Json);

        trend!.Should().HaveCount(6);
        trend.Should().OnlyContain(t => t.Income == 0m && t.Expense == 0m);
    }

    [Fact]
    public async Task Diario_do_mes_atual_retorna_todos_os_dias()
    {
        var client = await CreateUserClientAsync();

        var daily = await (await client.GetAsync("/api/v1/reports/daily")).Content
            .ReadFromJsonAsync<List<DailyExpenseReportResponse>>(Json);

        var now = DateTime.UtcNow;
        daily!.Should().HaveCount(DateTime.DaysInMonth(now.Year, now.Month));
        daily.Should().OnlyContain(d => d.Value == 0m);
    }
}
