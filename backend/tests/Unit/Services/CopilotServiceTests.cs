using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
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

    [Fact]
    public async Task Registrar_gasto_retorna_acao_de_rascunho_com_valor()
    {
        var reply = await _client.ReplyAsync("Quero registrar um gasto de R$ 45,90 no mercado", Context());

        reply.Actions.Should().ContainSingle(a => a.Tool == "open_transaction_sheet")
            .Which.Args["value"].Should().Be(45.90m);
        reply.Actions[0].Args["categoryName"].Should().Be("Alimentação");
    }

    [Fact]
    public async Task Resumo_retorna_numeros_reais_do_contexto()
    {
        var reply = await _client.ReplyAsync("Me da um resumo do mes", Context());

        reply.Content.Should().Contain("R$ 5000,00").And.Contain("R$ 1200,00").And.Contain("R$ 3800,00");
        reply.Actions.Should().BeEmpty();
    }

    [Fact]
    public async Task Economizar_sugere_categoria_acima_do_teto()
    {
        var reply = await _client.ReplyAsync("Onde posso economizar este mes?", Context());

        reply.Content.Should().Contain("Lazer").And.Contain("124%");
    }

    [Fact]
    public async Task Mensagem_generica_recebe_resposta_padrao()
    {
        var reply = await _client.ReplyAsync("Bom dia", Context());

        reply.Content.Should().NotBeNullOrWhiteSpace();
        reply.Actions.Should().BeEmpty();
    }
}

public class CompositeCopilotClientTests
{
    [Fact]
    public async Task Falha_do_llm_caia_no_fallback_baseado_em_regras()
    {
        var failing = new Mock<ICopilotAiClient>();
        failing.Setup(c => c.ReplyAsync(It.IsAny<string>(), It.IsAny<CopilotFinancialContext>()))
            .ThrowsAsync(new HttpRequestException("provedor fora do ar"));
        var composite = new CompositeCopilotClient(null, new RuleBasedCopilotClient(), Mock.Of<ILogger<CompositeCopilotClient>>());

        var reply = await composite.ReplyAsync("resumo do mes",
            new CopilotFinancialContext(100m, 200m, 50m, 300m, [], []));

        reply.Content.Should().Contain("R$ 200,00");
    }
}

public class CopilotServiceTests
{
    private readonly Mock<IChatMessageRepository> _chatRepository = new();
    private readonly Mock<ITransactionRepository> _transactionRepository = new();
    private readonly Mock<IBudgetRepository> _budgetRepository = new();
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly Mock<ICopilotAiClient> _aiClient = new();
    private readonly CopilotService _service;

    public CopilotServiceTests()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Copilot:DailyMessageLimit"] = "2" })
            .Build();
        _service = new CopilotService(_chatRepository.Object, _transactionRepository.Object, _budgetRepository.Object,
            _userRepository.Object, _aiClient.Object, configuration);
    }

    private static CopilotFinancialContext Context() => new(3800m, 5000m, 1200m, 6350m, [], []);

    [Fact]
    public async Task Enviar_mensagem_persiste_usuario_e_assistente_com_acoes()
    {
        _chatRepository.Setup(r => r.CountSinceAsync(1, ChatRole.User, It.IsAny<DateTime>())).ReturnsAsync(0);
        _userRepository.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(new User { Id = 1 });
        _transactionRepository.Setup(r => r.SumAsync(It.IsAny<int>(), It.IsAny<TransactionType>(), It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<int?>())).ReturnsAsync(0m);
        _transactionRepository.Setup(r => r.SumByCategoryAsync(It.IsAny<int>(), It.IsAny<TransactionType>(), It.IsAny<DateTime>(), It.IsAny<DateTime>())).ReturnsAsync([]);
        _budgetRepository.Setup(r => r.ListByPeriodAsync(1, It.IsAny<int>(), It.IsAny<int>())).ReturnsAsync([]);
        _aiClient.Setup(c => c.ReplyAsync("resumo", It.IsAny<CopilotFinancialContext>()))
            .ReturnsAsync(new CopilotReply("Resumo pronto",
                [new CopilotAction("open_transaction_sheet", new Dictionary<string, object?> { ["type"] = "expense" })]));

        var exchange = await _service.SendMessageAsync(1, "resumo");

        exchange.UserMessage.Content.Should().Be("resumo");
        exchange.AssistantMessage.Content.Should().Be("Resumo pronto");
        exchange.AssistantMessage.Actions.Should().ContainSingle(a => a.Tool == "open_transaction_sheet");
        _chatRepository.Verify(r => r.AddAsync(It.IsAny<ChatMessage>()), Times.Exactly(2));
    }

    [Fact]
    public async Task Cota_diaria_atingida_lanca_429()
    {
        _chatRepository.Setup(r => r.CountSinceAsync(1, ChatRole.User, It.IsAny<DateTime>())).ReturnsAsync(2);

        var act = () => _service.SendMessageAsync(1, "mais uma mensagem");

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(429);
        _aiClient.Verify(c => c.ReplyAsync(It.IsAny<string>(), It.IsAny<CopilotFinancialContext>()), Times.Never);
    }

    [Fact]
    public async Task Mensagem_vazia_lanca_400_sem_consumir_cota()
    {
        var act = () => _service.SendMessageAsync(1, "   ");

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(400);
        _chatRepository.Verify(r => r.AddAsync(It.IsAny<ChatMessage>()), Times.Never);
    }
}
