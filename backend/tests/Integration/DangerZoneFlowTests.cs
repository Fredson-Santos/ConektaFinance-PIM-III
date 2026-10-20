using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using FluentAssertions;
using PIM_III_Backend.Application.Dtos;
using Xunit;

namespace PIM_III_Backend.Tests.Integration;

public class DangerZoneFlowTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    private static readonly System.Text.Json.JsonSerializerOptions Json = TestJson.Options;
    private readonly HttpClient _client = factory.CreateClient();

    private async Task<(HttpClient client, string password)> CreateUserAsync()
    {
        var password = "SenhaForte@123";
        var email = $"{Guid.NewGuid():N}@conekta.teste";
        var register = await _client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest("Usuario Perigo", email, password, null, null));
        var auth = await register.Content.ReadFromJsonAsync<AuthResponse>(Json);
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
        return (client, password);
    }

    private static object NewExpense(int categoryId, decimal value) => new
    {
        type = "expense",
        categoryId,
        description = "Gasto qualquer",
        value,
        transactionDate = DateTime.UtcNow.AddDays(-1).ToString("yyyy-MM-dd"),
        paymentMethod = "pix"
    };

    [Fact]
    public async Task Redefinir_registros_apaga_lancamentos_e_mantem_categorias()
    {
        var (client, _) = await CreateUserAsync();
        var categories = await (await client.GetAsync("/api/v1/categories?kind=expense")).Content
            .ReadFromJsonAsync<List<CategoryResponse>>(Json);
        await client.PostAsJsonAsync("/api/v1/transactions", NewExpense(categories!.First().Id, 100m));

        var reset = await client.PostAsync("/api/v1/users/me/reset-data", null);
        reset.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var list = await (await client.GetAsync("/api/v1/transactions")).Content
            .ReadFromJsonAsync<TransactionListResponse>(Json);
        list!.Meta.TotalItems.Should().Be(0);
        var remainingCategories = await (await client.GetAsync("/api/v1/categories")).Content
            .ReadFromJsonAsync<List<CategoryResponse>>(Json);
        remainingCategories!.Should().HaveCount(13);
    }

    [Fact]
    public async Task Excluir_conta_com_senha_errada_retorna_400()
    {
        var (client, _) = await CreateUserAsync();

        var request = new HttpRequestMessage(HttpMethod.Delete, "/api/v1/users/me")
        {
            Content = JsonContent.Create(new DeleteAccountRequest("SenhaErrada@999"))
        };
        var bad = await client.SendAsync(request);
        bad.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Excluir_conta_com_senha_certa_impede_login_posterior()
    {
        var email = $"{Guid.NewGuid():N}@conekta.teste";
        var register = await _client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest("Conta Temporaria", email, "SenhaForte@123", null, null));
        var auth = await register.Content.ReadFromJsonAsync<AuthResponse>(Json);
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);

        var request = new HttpRequestMessage(HttpMethod.Delete, "/api/v1/users/me")
        {
            Content = JsonContent.Create(new DeleteAccountRequest("SenhaForte@123"))
        };
        var deleted = await client.SendAsync(request);
        deleted.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var login = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(email, "SenhaForte@123"));
        login.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Exportacao_csv_retorna_arquivo_ptbr_com_bom()
    {
        var (client, _) = await CreateUserAsync();
        var categories = await (await client.GetAsync("/api/v1/categories?kind=expense")).Content
            .ReadFromJsonAsync<List<CategoryResponse>>(Json);
        await client.PostAsJsonAsync("/api/v1/transactions", NewExpense(categories!.First().Id, 123.45m));

        var response = await client.GetAsync("/api/v1/reports/export.csv");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType!.ToString().Should().Contain("text/csv");
        response.Content.Headers.ContentDisposition!.FileName.Should().StartWith("transacoes_");

        var bytes = await response.Content.ReadAsByteArrayAsync();
        var text = Encoding.UTF8.GetString(bytes.Skip(3).ToArray());
        text.Should().Contain("Data;Descricao;Categoria;Tipo;Valor");
        text.Should().Contain("123,45");
        text.Should().Contain("Despesa");
    }

    [Fact]
    public async Task Exportacao_json_traz_lancamentos_do_periodo()
    {
        var (client, _) = await CreateUserAsync();
        var categories = await (await client.GetAsync("/api/v1/categories?kind=expense")).Content
            .ReadFromJsonAsync<List<CategoryResponse>>(Json);
        await client.PostAsJsonAsync("/api/v1/transactions", NewExpense(categories!.First().Id, 99m));

        var export = await (await client.GetAsync("/api/v1/reports/export.json")).Content
            .ReadFromJsonAsync<PeriodExportResponse>(Json);

        export!.Transactions.Should().ContainSingle(t => t.Value == 99m);
        export.Start.Day.Should().Be(1);
    }
}
