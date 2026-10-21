using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text.Json;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Exceptions;
using PIM_III_Backend.Application.Services;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Domain.Interfaces;
using PIM_III_Backend.Infrastructure.Copilot;

namespace PIM_III_Backend.Tests.Unit.Services;

public class RuleBasedCopilotClientTests
{
    private readonly RuleBasedCopilotClient _client = new();

    private static CopilotFinancialContext Context(decimal income = 5000m, decimal expense = 1200m) => new(
        3800m, income, expense, 6350m,
        [new CategoryBudgetSnapshot("Lazer", 310m, 250m, 124, "over")],
        ["Lazer"]);

    private static CopilotAgentRequest Request(string message, CopilotFinancialContext? context = null,
        ReceiptExtract? receipt = null, bool hasImage = false) =>
        new(1, message, hasImage, receipt, [], context ?? Context());

    [Fact]
    public async Task Registrar_gasto_retorna_rascunho_com_valor()
    {
        var reply = await _client.ReplyAsync(Request("Quero registrar um gasto de R$ 45,90 no mercado"));

        reply.Actions.Should().ContainSingle(a => a.Tool == "draft_transaction")
            .Which.Args["value"].Should().Be(45.90m);
        reply.Actions[0].Args["categoryName"].Should().Be("Alimentação");
    }

    [Fact]
    public async Task Resumo_retorna_numeros_reais_do_contexto()
    {
        var reply = await _client.ReplyAsync(Request("Me da um resumo do mes"));

        reply.Content.Should().Contain("R$ 5000,00").And.Contain("R$ 1200,00").And.Contain("R$ 3800,00");
        reply.Actions.Should().BeEmpty();
    }

    [Fact]
    public async Task Economizar_sugere_categoria_acima_do_teto()
    {
        var reply = await _client.ReplyAsync(Request("Onde posso economizar este mes?"));

        reply.Content.Should().Contain("Lazer").And.Contain("124%");
    }

    [Fact]
    public async Task Mensagem_generica_recebe_resposta_padrao()
    {
        var reply = await _client.ReplyAsync(Request("Bom dia"));

        reply.Content.Should().NotBeNullOrWhiteSpace();
        reply.Actions.Should().BeEmpty();
    }

    [Fact]
    public async Task Nota_fiscal_extraida_gera_rascunho_com_total()
    {
        var receipt = new ReceiptExtract("Padaria Central", 42.90m, "2026-10-01", [new ReceiptItem("Pao", 8.5m)]);

        var reply = await _client.ReplyAsync(Request("", receipt: receipt, hasImage: true));

        reply.Actions.Should().ContainSingle(a => a.Tool == "draft_transaction");
        reply.Actions[0].Args["value"].Should().Be(42.90m);
        reply.Actions[0].Args["description"].Should().Be("Compra em Padaria Central");
        reply.Content.Should().Contain("nota fiscal");
    }
}

public class CompositeCopilotClientTests
{
    [Fact]
    public async Task Falha_do_llm_caia_no_fallback_baseado_em_regras()
    {
        var failing = new Mock<ICopilotAiClient>();
        failing.Setup(c => c.ReplyAsync(It.IsAny<CopilotAgentRequest>()))
            .ThrowsAsync(new HttpRequestException("provedor fora do ar"));
        var ruleBased = new RuleBasedCopilotClient();
        var composite = new CompositeCopilotClient(null, ruleBased, Mock.Of<ILogger<CompositeCopilotClient>>());

        var reply = await composite.ReplyAsync(new CopilotAgentRequest(
            1, "resumo do mes", false, null, [], new CopilotFinancialContext(100m, 200m, 50m, 300m, [], [])));

        reply.Content.Should().Contain("R$ 200,00");
    }

    [Fact]
    public async Task Extracao_de_nota_com_vision_indisponivel_retorna_nulo()
    {
        var failing = new Mock<ICopilotAiClient>();
        failing.Setup(c => c.ExtractReceiptAsync(It.IsAny<string>()))
            .ThrowsAsync(new InvalidOperationException("vision nao configurado"));
        var composite = new CompositeCopilotClient(null, new RuleBasedCopilotClient(),
            Mock.Of<ILogger<CompositeCopilotClient>>());

        var extract = await composite.ExtractReceiptAsync("aGVsbG8=");

        extract.Should().BeNull();
    }
}

public class CopilotServiceTests
{
    private readonly Mock<IChatMessageRepository> _chatRepository = new();
    private readonly Mock<ICopilotToolProvider> _toolProvider = new();
    private readonly Mock<ICopilotAiClient> _aiClient = new();
    private readonly Mock<ICopilotImageStorage> _imageStorage = new();
    private readonly CopilotService _service;

    public CopilotServiceTests()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Copilot:DailyMessageLimit"] = "2",
                ["Copilot:HistoryWindowSize"] = "12"
            })
            .Build();
        _service = new CopilotService(_chatRepository.Object, _toolProvider.Object, _aiClient.Object,
            _imageStorage.Object, configuration);
    }

    private static CopilotFinancialContext Context() => new(3800m, 5000m, 1200m, 6350m, [], []);

    [Fact]
    public async Task Enviar_mensagem_persiste_usuario_e_assistente_com_acoes()
    {
        _chatRepository.Setup(r => r.CountSinceAsync(1, ChatRole.User, It.IsAny<DateTime>())).ReturnsAsync(0);
        _chatRepository.Setup(r => r.ListRecentAsync(1, It.IsAny<int>())).ReturnsAsync([]);
        _toolProvider.Setup(t => t.BuildContextAsync(1, It.IsAny<int>(), It.IsAny<int>())).ReturnsAsync(Context());
        _aiClient.Setup(c => c.ReplyAsync(It.IsAny<CopilotAgentRequest>()))
            .ReturnsAsync(new CopilotReply("Resumo pronto",
                [new CopilotAction("draft_transaction", new Dictionary<string, object?> { ["type"] = "expense" })]));

        var exchange = await _service.SendMessageAsync(1, "resumo");

        exchange.UserMessage.Content.Should().Be("resumo");
        exchange.AssistantMessage.Content.Should().Be("Resumo pronto");
        exchange.AssistantMessage.Actions.Should().ContainSingle(a => a.Tool == "draft_transaction")
            .Which.Status.Should().Be("pending");
        _aiClient.Verify(c => c.ReplyAsync(It.Is<CopilotAgentRequest>(r =>
            r.UserMessage == "resumo" &&
            r.BaseContext.MonthlyExpense == 1200m)), Times.Once);
        _chatRepository.Verify(r => r.AddAsync(It.IsAny<ChatMessage>()), Times.Exactly(2));
    }

    [Fact]
    public async Task Enviar_imagem_extrai_nota_e_salva_arquivo()
    {
        _chatRepository.Setup(r => r.CountSinceAsync(1, ChatRole.User, It.IsAny<DateTime>())).ReturnsAsync(0);
        _chatRepository.Setup(r => r.ListRecentAsync(1, It.IsAny<int>())).ReturnsAsync([]);
        _toolProvider.Setup(t => t.BuildContextAsync(1, It.IsAny<int>(), It.IsAny<int>())).ReturnsAsync(Context());
        _imageStorage.Setup(s => s.SaveAsync(1, It.IsAny<string>(), It.IsAny<Stream>()))
            .ReturnsAsync("/uploads/copilot/receipt_1_abc.png");
        _aiClient.Setup(c => c.ExtractReceiptAsync(It.IsAny<string>()))
            .ReturnsAsync(new ReceiptExtract("Padaria Central", 42.9m, null, []));
        _aiClient.Setup(c => c.ReplyAsync(It.IsAny<CopilotAgentRequest>()))
            .ReturnsAsync(new CopilotReply("Li a nota", []));

        var exchange = await _service.SendMessageAsync(1, "", "data:image/png;base64,AAAA");

        exchange.UserMessage.ImageUrl.Should().Be("/uploads/copilot/receipt_1_abc.png");
        _aiClient.Verify(c => c.ExtractReceiptAsync(It.IsAny<string>()), Times.Once);
        _aiClient.Verify(c => c.ReplyAsync(It.Is<CopilotAgentRequest>(r =>
            r.HasImage && r.Receipt!.Total == 42.9m)), Times.Once);
        _imageStorage.Verify(s => s.SaveAsync(1, ".png", It.IsAny<Stream>()), Times.Once);
    }

    [Fact]
    public async Task Cota_diaria_atingida_lanca_429()
    {
        _chatRepository.Setup(r => r.CountSinceAsync(1, ChatRole.User, It.IsAny<DateTime>())).ReturnsAsync(2);

        var act = () => _service.SendMessageAsync(1, "mais uma mensagem");

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(429);
        _aiClient.Verify(c => c.ReplyAsync(It.IsAny<CopilotAgentRequest>()), Times.Never);
    }

    [Fact]
    public async Task Mensagem_vazia_lanca_400_sem_consumir_cota()
    {
        var act = () => _service.SendMessageAsync(1, "   ");

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(400);
        _chatRepository.Verify(r => r.AddAsync(It.IsAny<ChatMessage>()), Times.Never);
    }

    [Fact]
    public async Task Confirmar_rascunho_cria_transacao_e_marca_como_consumida()
    {
        var message = new ChatMessage
        {
            Id = 5,
            UserId = 1,
            Role = ChatRole.Assistant,
            Content = "Confirma?",
            ActionPayload = """
                [{"Tool":"draft_transaction","Args":{"type":"expense","value":45.9,"description":"Ifood","categoryName":"Alimentação"},"Status":"pending"}]
                """
        };
        _chatRepository.Setup(r => r.GetByIdAndUserAsync(5, 1)).ReturnsAsync(message);
        _toolProvider.Setup(t => t.ExecuteAsync(1, "create_transaction", It.IsAny<JsonElement>()))
            .ReturnsAsync("""{"success":true,"transactionId":10,"description":"Ifood","value":45.9,"category":"Alimentação"}""");

        var confirmation = await _service.ConfirmDraftAsync(1, 5);

        confirmation.Content.Should().Contain("Ifood").And.Contain("R$ 45,90");
        _toolProvider.Verify(t => t.ExecuteAsync(1, "create_transaction", It.IsAny<JsonElement>()), Times.Once);
        _chatRepository.Verify(r => r.UpdateAsync(It.Is<ChatMessage>(m =>
            m.ActionPayload!.Contains("consumed") && m.ActionPayload.Contains("10"))), Times.Once);
        _chatRepository.Verify(r => r.AddAsync(It.Is<ChatMessage>(m =>
            m.Role == ChatRole.Assistant && m.Content.Contains("Ifood"))), Times.Once);
    }

    [Fact]
    public async Task Confirmar_duas_vezes_retorna_409()
    {
        var message = new ChatMessage
        {
            Id = 5,
            UserId = 1,
            Role = ChatRole.Assistant,
            Content = "Confirma?",
            ActionPayload = """
                [{"Tool":"draft_transaction","Args":{"type":"expense","value":45.9,"description":"Ifood"},"Status":"consumed"}]
                """
        };
        _chatRepository.Setup(r => r.GetByIdAndUserAsync(5, 1)).ReturnsAsync(message);

        var act = () => _service.ConfirmDraftAsync(1, 5);

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(409);
        _toolProvider.Verify(t => t.ExecuteAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<JsonElement>()), Times.Never);
    }

    [Fact]
    public async Task Confirmar_mensagem_inexistente_retorna_404()
    {
        _chatRepository.Setup(r => r.GetByIdAndUserAsync(99, 1)).ReturnsAsync((ChatMessage?)null);

        var act = () => _service.ConfirmDraftAsync(1, 99);

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(404);
    }

    [Fact]
    public async Task Confirmar_mensagem_do_usuario_retorna_409()
    {
        var message = new ChatMessage { Id = 3, UserId = 1, Role = ChatRole.User, Content = "registrar gasto" };
        _chatRepository.Setup(r => r.GetByIdAndUserAsync(3, 1)).ReturnsAsync(message);

        var act = () => _service.ConfirmDraftAsync(1, 3);

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(409);
    }
}
