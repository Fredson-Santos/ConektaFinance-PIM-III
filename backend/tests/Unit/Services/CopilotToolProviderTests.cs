using FluentAssertions;
using Moq;
using System.Text.Json;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Services;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Domain.Interfaces;
using PIM_III_Backend.Domain.Models;

namespace PIM_III_Backend.Tests.Unit.Services;

public class CopilotToolProviderTests
{
    private readonly Mock<ITransactionService> _transactionService = new();
    private readonly Mock<ITransactionRepository> _transactionRepository = new();
    private readonly Mock<IBudgetRepository> _budgetRepository = new();
    private readonly Mock<ICategoryService> _categoryService = new();
    private readonly Mock<IAlertService> _alertService = new();
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly CopilotToolProvider _provider;

    public CopilotToolProviderTests()
    {
        _provider = new CopilotToolProvider(
            _transactionService.Object,
            _transactionRepository.Object,
            _budgetRepository.Object,
            _categoryService.Object,
            _alertService.Object,
            _userRepository.Object);
    }

    private static List<CategoryResponse> Categories() =>
    [
        new(3, "Alimentação", null, "#f00", "icon", CategoryKind.Expense, 1, true, null, null, null),
        new(4, "Transporte", null, "#0f0", "icon", CategoryKind.Expense, 2, true, null, null, null)
    ];

    private static JsonElement Args(object anonymous) =>
        JsonSerializer.SerializeToElement(anonymous);

    [Fact]
    public async Task Criar_transacao_grava_e_dispara_checagem_de_alerta()
    {
        _categoryService.Setup(c => c.ListAsync(1, "expense", null, null)).ReturnsAsync(Categories());
        _transactionService
            .Setup(s => s.CreateAsync(1, It.IsAny<CreateTransactionRequest>()))
            .ReturnsAsync(new TransactionResponse(
                10, TransactionType.Expense, "Ifood", 89.9m, new DateTime(2026, 10, 21),
                null, null, false, TransactionStatus.Active, TransactionSource.Manual,
                new CategoryBrief(3, "Alimentação", "#f00", "icon"), DateTime.UtcNow));

        var result = await _provider.ExecuteAsync(1, "create_transaction",
            Args(new { type = "expense", description = "Ifood", value = 89.9, categoryName = "alimentação" }));

        using var document = JsonDocument.Parse(result);
        document.RootElement.GetProperty("success").GetBoolean().Should().BeTrue();
        document.RootElement.GetProperty("transactionId").GetInt32().Should().Be(10);
        _transactionService.Verify(s => s.CreateAsync(1, It.Is<CreateTransactionRequest>(r =>
            r.CategoryId == 3 && r.Value == 89.9m && r.Description == "Ifood")), Times.Once);
        _alertService.Verify(a => a.CheckBudgetAlertsAsync(1, 3, 2026, 10), Times.Once);
    }

    [Fact]
    public async Task Criar_transacao_com_categoria_inexistente_retorna_erro_com_disponiveis()
    {
        _categoryService.Setup(c => c.ListAsync(1, "expense", null, null)).ReturnsAsync(Categories());
        _categoryService.Setup(c => c.ListAsync(1, null, null, null)).ReturnsAsync(Categories());

        var result = await _provider.ExecuteAsync(1, "create_transaction",
            Args(new { type = "expense", description = "Presente", value = 50, categoryName = "Pets" }));

        using var document = JsonDocument.Parse(result);
        document.RootElement.GetProperty("error").GetString().Should()
            .Contain("Pets").And.Contain("Alimentação").And.Contain("Transporte");
        _transactionService.Verify(s => s.CreateAsync(It.IsAny<int>(), It.IsAny<CreateTransactionRequest>()), Times.Never);
    }

    [Fact]
    public async Task Rascunho_nunca_grava_transacao()
    {
        _categoryService.Setup(c => c.ListAsync(1, "expense", null, null)).ReturnsAsync(Categories());

        var result = await _provider.ExecuteAsync(1, "draft_transaction",
            Args(new { type = "expense", description = "Ifood", value = 45.9, categoryName = "Alimentação" }));

        using var document = JsonDocument.Parse(result);
        document.RootElement.GetProperty("success").GetBoolean().Should().BeTrue();
        document.RootElement.GetProperty("draft").GetProperty("value").GetDecimal().Should().Be(45.9m);
        _transactionService.Verify(s => s.CreateAsync(It.IsAny<int>(), It.IsAny<CreateTransactionRequest>()), Times.Never);
    }

    [Fact]
    public async Task Resumo_retorna_agregados_do_periodo()
    {
        _userRepository.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(new User { Id = 1, MonthlyCeiling = 6350m });
        _transactionRepository
            .Setup(r => r.SumAsync(It.IsAny<int>(), It.IsAny<TransactionType>(), It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<int?>()))
            .ReturnsAsync((int _, TransactionType type, DateTime _, DateTime _, int? _) => type == TransactionType.Income ? 6000m : 1700m);
        _transactionRepository
            .Setup(r => r.SumByCategoryAsync(It.IsAny<int>(), It.IsAny<TransactionType>(), It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync([]);
        _budgetRepository.Setup(r => r.ListByPeriodAsync(1, It.IsAny<int>(), It.IsAny<int>())).ReturnsAsync([]);

        var result = await _provider.ExecuteAsync(1, "get_financial_summary", Args(new { }));

        using var document = JsonDocument.Parse(result);
        document.RootElement.GetProperty("monthlyIncome").GetDecimal().Should().Be(6000m);
        document.RootElement.GetProperty("monthlyExpense").GetDecimal().Should().Be(1700m);
        document.RootElement.GetProperty("balance").GetDecimal().Should().Be(4300m);
        document.RootElement.GetProperty("monthlyCeiling").GetDecimal().Should().Be(6350m);
    }

    [Fact]
    public async Task Alertas_retorna_apenas_nao_lidos()
    {
        _alertService.Setup(a => a.ListAsync(1, true)).ReturnsAsync(
        [
            new AlertResponse(7, "budget", "Teto excedido", "Lazer passou do limite",
                new AlertCategoryBrief(3, "Lazer"), false, DateTime.UtcNow)
        ]);

        var result = await _provider.ExecuteAsync(1, "list_budget_alerts", Args(new { }));

        using var document = JsonDocument.Parse(result);
        document.RootElement.GetProperty("count").GetInt32().Should().Be(1);
        document.RootElement.GetProperty("alerts")[0].GetProperty("title").GetString().Should().Be("Teto excedido");
    }

    [Fact]
    public async Task Transacoes_recentes_respeitam_limite()
    {
        _transactionService
            .Setup(s => s.ListAsync(It.IsAny<TransactionFilter>()))
            .ReturnsAsync(new TransactionListResponse(
            [
                new TransactionResponse(10, TransactionType.Expense, "Mercado", 250m, new DateTime(2026, 10, 20),
                    null, null, false, TransactionStatus.Active, TransactionSource.Manual,
                    new CategoryBrief(3, "Alimentação", "#f00", "icon"), DateTime.UtcNow)
            ], new PaginationMeta(1, 10, 1, 1)));

        var result = await _provider.ExecuteAsync(1, "list_recent_transactions",
            Args(new { limit = 5, type = "expense" }));

        _transactionService.Verify(s => s.ListAsync(It.Is<TransactionFilter>(f =>
            f.UserId == 1 && f.PageSize == 5 && f.Type == TransactionType.Expense)), Times.Once);
        using var document = JsonDocument.Parse(result);
        document.RootElement.GetProperty("items")[0].GetProperty("description").GetString().Should().Be("Mercado");
    }

    [Fact]
    public async Task Tool_desconhecida_retorna_erro_sem_lancar()
    {
        var result = await _provider.ExecuteAsync(1, "ferramenta_inexistente", Args(new { }));

        using var document = JsonDocument.Parse(result);
        document.RootElement.GetProperty("error").GetString().Should().Contain("desconhecida");
    }
}
