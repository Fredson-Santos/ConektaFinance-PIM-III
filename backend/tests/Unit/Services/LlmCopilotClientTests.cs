using System.Net;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using PIM_III_Backend.Application.Services;
using PIM_III_Backend.Infrastructure.Copilot;

namespace PIM_III_Backend.Tests.Unit.Services;

internal sealed class FakeHttpMessageHandler(Func<int, string> responseBodyFactory) : HttpMessageHandler
{
    public List<string> RequestBodies { get; } = [];

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        RequestBodies.Add(await request.Content!.ReadAsStringAsync(cancellationToken));
        var index = RequestBodies.Count - 1;
        return new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(responseBodyFactory(index), Encoding.UTF8, "application/json")
        };
    }
}

public class LlmCopilotClientTests
{
    private readonly Mock<ICopilotToolProvider> _toolProvider = new();
    private FakeHttpMessageHandler _handler = null!;

    private LlmCopilotClient CreateClient(Func<int, string> responses)
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Copilot:BaseUrl"] = "http://test.local/v1",
            ["Copilot:ApiKey"] = "chave-teste",
            ["Copilot:Model"] = "modelo-teste",
            ["Copilot:VisionModel"] = "visao-teste",
            ["Copilot:MaxToolIterations"] = "4"
        }).Build();
        var httpClientFactory = new Mock<IHttpClientFactory>();
        _handler = new FakeHttpMessageHandler(responses);
        httpClientFactory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(() => new HttpClient(_handler));
        _toolProvider.SetupGet(p => p.Definitions).Returns([]);
        return new LlmCopilotClient(httpClientFactory.Object, configuration, _toolProvider.Object,
            Mock.Of<ILogger<LlmCopilotClient>>());
    }

    private static CopilotAgentRequest Request(string message = "resumo") =>
        new(1, message, false, null, [], new CopilotFinancialContext(100m, 200m, 50m, 300m, [], []));

    private static string Completion(string content) =>
        System.Text.Json.JsonSerializer.Serialize(new
        {
            choices = new object[]
            {
                new { message = new { role = "assistant", content } }
            }
        });

    private static string ToolCallCompletion(string id, string name, string arguments) =>
        System.Text.Json.JsonSerializer.Serialize(new
        {
            choices = new object[]
            {
                new
                {
                    message = new
                    {
                        role = "assistant",
                        content = (string?)null,
                        tool_calls = new object[]
                        {
                            new { id, type = "function", function = new { name, arguments } }
                        }
                    }
                }
            }
        });

    [Fact]
    public async Task Loop_executa_tool_e_devolve_resposta_final()
    {
        var client = CreateClient(index => index switch
        {
            0 => ToolCallCompletion("call_1", "get_financial_summary", "{}"),
            _ => Completion("""{"content":"Resumo do mes: saldo de R$ 100,00","actions":[]}""")
        });
        _toolProvider.Setup(p => p.ExecuteAsync(1, "get_financial_summary", It.IsAny<JsonElement>()))
            .ReturnsAsync("""{"month":10,"year":2026,"balance":100,"monthlyIncome":200,"monthlyExpense":50}""");

        var reply = await client.ReplyAsync(Request());

        reply.Content.Should().Be("Resumo do mes: saldo de R$ 100,00");
        reply.Actions.Should().BeEmpty();
        _toolProvider.Verify(p => p.ExecuteAsync(1, "get_financial_summary", It.IsAny<JsonElement>()), Times.Once);
        _handler.RequestBodies.Should().HaveCount(2);
        _handler.RequestBodies[1].Should().Contain("\"role\":\"tool\"").And.Contain("call_1");
    }

    [Fact]
    public async Task Rascunho_de_tool_e_anexado_automaticamente_a_resposta()
    {
        var client = CreateClient(index => index switch
        {
            0 => ToolCallCompletion("call_2", "draft_transaction",
                """{"type":"expense","description":"Ifood","value":45.9}"""),
            _ => Completion("""{"content":"Encontrei o lancamento. Confirma?","actions":[]}""")
        });
        _toolProvider.Setup(p => p.ExecuteAsync(1, "draft_transaction", It.IsAny<JsonElement>()))
            .ReturnsAsync("""{"success":true,"draft":{"type":"expense","description":"Ifood","value":45.9,"categoryName":"Alimentação"}}""");

        var reply = await client.ReplyAsync(Request("foto da nota fiscal"));

        reply.Content.Should().Be("Encontrei o lancamento. Confirma?");
        var action = reply.Actions.Should().ContainSingle(a => a.Tool == "draft_transaction").Subject;
        ((JsonElement)action.Args["value"]!).GetDecimal().Should().Be(45.9m);
        ((JsonElement)action.Args["description"]!).GetString().Should().Be("Ifood");
    }

    [Fact]
    public async Task Resposta_sem_json_valido_e_tratada_como_texto_puro()
    {
        var client = CreateClient(_ => Completion("Pergunta mal formada, sem JSON"));

        var reply = await client.ReplyAsync(Request());

        reply.Content.Should().Be("Pergunta mal formada, sem JSON");
        reply.Actions.Should().BeEmpty();
    }

    [Fact]
    public async Task Extracao_de_nota_interpreta_dados_da_vision()
    {
        var client = CreateClient(_ =>
            Completion("""{"merchant":"Padaria Central","total":42.9,"date":"2026-10-01","items":[{"name":"Pao","value":8.5}]}"""));

        var extract = await client.ExtractReceiptAsync("aGVsbG8=");

        extract.Should().NotBeNull();
        extract!.Merchant.Should().Be("Padaria Central");
        extract.Total.Should().Be(42.9m);
        extract.Date.Should().Be("2026-10-01");
        extract.Items.Should().ContainSingle(i => i.Name == "Pao" && i.Value == 8.5m);
    }

    [Fact]
    public async Task Sem_tool_calls_resposta_final_e_repassada_direto()
    {
        var client = CreateClient(_ => Completion("""{"content":"Oi! Como posso ajudar?","actions":[]}"""));

        var reply = await client.ReplyAsync(Request("oi"));

        reply.Content.Should().Be("Oi! Como posso ajudar?");
        _toolProvider.Verify(p => p.ExecuteAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<JsonElement>()), Times.Never);
    }
}
