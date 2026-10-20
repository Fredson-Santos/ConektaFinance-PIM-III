using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using PIM_III_Backend.Application.Dtos;
using Xunit;

namespace PIM_III_Backend.Tests.Integration;

public class CopilotFlowTests : IClassFixture<CustomWebApplicationFactory>
{
    private static readonly System.Text.Json.JsonSerializerOptions Json = TestJson.Options;
    private readonly CustomWebApplicationFactory _factory;

    public CopilotFlowTests(CustomWebApplicationFactory factory) => _factory = factory;

    private async Task<HttpClient> CreateUserClientAsync()
    {
        var client = _factory.CreateClient();
        var register = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest("Usuario Copilot", $"{Guid.NewGuid():N}@conekta.teste", "SenhaForte@123", null, null));
        var auth = await register.Content.ReadFromJsonAsync<AuthResponse>(Json);
        var authorized = _factory.CreateClient();
        authorized.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
        return authorized;
    }

    [Fact]
    public async Task Resumo_do_mes_responde_com_numeros_do_usuario()
    {
        var client = await CreateUserClientAsync();
        var categories = await (await client.GetAsync("/api/v1/categories?kind=expense")).Content
            .ReadFromJsonAsync<List<CategoryResponse>>(Json);
        await client.PostAsJsonAsync("/api/v1/transactions", new
        {
            type = "expense",
            categoryId = categories!.First().Id,
            description = "Mercado",
            value = 250m,
            transactionDate = DateTime.UtcNow.AddDays(-1).ToString("yyyy-MM-dd"),
            paymentMethod = "pix"
        });

        var exchange = await (await client.PostAsJsonAsync("/api/v1/copilot/messages",
            new SendCopilotMessageRequest("Me de um resumo do mes"))).Content
            .ReadFromJsonAsync<CopilotExchangeResponse>(Json);

        exchange!.UserMessage.Role.Should().Be("user");
        exchange.AssistantMessage.Content.Should().Contain("R$ 250,00");
        exchange.AssistantMessage.Actions.Should().BeNull();
    }

    [Fact]
    public async Task Registrar_gasto_retorna_acao_que_o_front_confirma()
    {
        var client = await CreateUserClientAsync();

        var exchange = await (await client.PostAsJsonAsync("/api/v1/copilot/messages",
            new SendCopilotMessageRequest("Registrar um gasto de R$ 45 no uber"))).Content
            .ReadFromJsonAsync<CopilotExchangeResponse>(Json);

        var action = exchange!.AssistantMessage.Actions.Should().ContainSingle(a => a.Tool == "open_transaction_sheet").Subject;
        action.Args!["value"].ToString().Should().Be("45");
        action.Args["categoryName"].ToString().Should().Be("Transporte");
    }

    [Fact]
    public async Task Historico_registra_as_trocas_e_limpeza_apaga()
    {
        var client = await CreateUserClientAsync();
        await client.PostAsJsonAsync("/api/v1/copilot/messages", new SendCopilotMessageRequest("resumo do mes"));

        var history = await (await client.GetAsync("/api/v1/copilot/history")).Content
            .ReadFromJsonAsync<CopilotHistoryResponse>(Json);
        history!.Items.Should().HaveCount(2);
        history.Items[0].Role.Should().Be("user");
        history.Items[1].Role.Should().Be("assistant");

        var clear = await client.DeleteAsync("/api/v1/copilot/history");
        clear.StatusCode.Should().Be(HttpStatusCode.NoContent);
        var cleared = await (await client.GetAsync("/api/v1/copilot/history")).Content
            .ReadFromJsonAsync<CopilotHistoryResponse>(Json);
        cleared!.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task Cota_diaria_atingida_retorna_429()
    {
        var factory = _factory.WithWebHostBuilder(b => b.UseSetting("Copilot:DailyMessageLimit", "2"));
        var client = factory.CreateClient();
        var register = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest("Usuario Cota", $"{Guid.NewGuid():N}@conekta.teste", "SenhaForte@123", null, null));
        var auth = await register.Content.ReadFromJsonAsync<AuthResponse>(Json);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);

        var first = await client.PostAsJsonAsync("/api/v1/copilot/messages", new SendCopilotMessageRequest("oi"));
        var second = await client.PostAsJsonAsync("/api/v1/copilot/messages", new SendCopilotMessageRequest("resumo"));
        var third = await client.PostAsJsonAsync("/api/v1/copilot/messages", new SendCopilotMessageRequest("economizar"));

        first.StatusCode.Should().Be(HttpStatusCode.OK);
        second.StatusCode.Should().Be(HttpStatusCode.OK);
        third.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
        var content = await third.Content.ReadAsStringAsync();
        content.Should().Contain("Limite diario");
    }

    [Fact]
    public async Task Mensagem_vazia_retorna_400()
    {
        var client = await CreateUserClientAsync();

        var response = await client.PostAsJsonAsync("/api/v1/copilot/messages", new { content = "" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
