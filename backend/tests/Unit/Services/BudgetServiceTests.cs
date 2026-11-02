using FluentAssertions;
using Moq;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Exceptions;
using PIM_III_Backend.Application.Services;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Tests.Unit.Services;

public class BudgetServiceTests
{
    private readonly Mock<IBudgetRepository> _budgetRepository = new();
    private readonly Mock<ICategoryRepository> _categoryRepository = new();
    private readonly Mock<ITransactionRepository> _transactionRepository = new();
    private readonly BudgetService _service;

    public BudgetServiceTests() =>
        _service = new BudgetService(_budgetRepository.Object, _categoryRepository.Object, _transactionRepository.Object);

    private static Category ExpenseCategory(int id = 5) =>
        new() { Id = id, UserId = 1, Name = "Alimentação", ColorCode = "#ef4444", Icon = "Utensils", Kind = CategoryKind.Expense };

    private BudgetUpsertRequest NewRequest(int categoryId = 5, decimal limit = 1000m) =>
        new(categoryId, limit, 10, 2026);

    [Fact]
    public async Task Upsert_cria_novo_teto_quando_nao_existe()
    {
        _categoryRepository.Setup(r => r.GetByIdAndUserAsync(5, 1)).ReturnsAsync(ExpenseCategory());
        _budgetRepository.Setup(r => r.GetAsync(1, 5, 10, 2026)).ReturnsAsync((Budget?)null);
        _transactionRepository
            .Setup(r => r.SumAsync(1, TransactionType.Expense, new DateTime(2026, 10, 1), new DateTime(2026, 11, 1), 5))
            .ReturnsAsync(200m);

        var response = await _service.UpsertAsync(1, NewRequest());

        response.LimitValue.Should().Be(1000m);
        response.Spent.Should().Be(200m);
        response.PercentageUsed.Should().Be(20);
        response.Status.Should().Be("ok");
    }

    [Fact]
    public async Task Upsert_atualiza_teto_existente_sem_duplicar()
    {
        var budget = new Budget { Id = 7, UserId = 1, CategoryId = 5, LimitValue = 500m, PeriodMonth = 10, PeriodYear = 2026 };
        _categoryRepository.Setup(r => r.GetByIdAndUserAsync(5, 1)).ReturnsAsync(ExpenseCategory());
        _budgetRepository.Setup(r => r.GetAsync(1, 5, 10, 2026)).ReturnsAsync(budget);
        _transactionRepository
            .Setup(r => r.SumAsync(1, TransactionType.Expense, new DateTime(2026, 10, 1), new DateTime(2026, 11, 1), 5))
            .ReturnsAsync(900m);

        var response = await _service.UpsertAsync(1, NewRequest(limit: 1000m));

        response.LimitValue.Should().Be(1000m);
        response.PercentageUsed.Should().Be(90);
        response.Status.Should().Be("warn");
        _budgetRepository.Verify(r => r.AddAsync(It.IsAny<Budget>()), Times.Never);
        _budgetRepository.Verify(r => r.UpdateAsync(budget), Times.Once);
    }

    [Fact]
    public async Task Upsert_em_categoria_de_entrada_lanca_erro()
    {
        _categoryRepository.Setup(r => r.GetByIdAndUserAsync(7, 1))
            .ReturnsAsync(new Category { Id = 7, UserId = 1, Kind = CategoryKind.Income });

        var act = () => _service.UpsertAsync(1, NewRequest(categoryId: 7));

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(400);
    }

    [Fact]
    public async Task Upsert_com_categoria_de_outro_usuario_lanca_nao_encontrado()
    {
        _categoryRepository.Setup(r => r.GetByIdAndUserAsync(5, 1)).ReturnsAsync((Category?)null);

        var act = () => _service.UpsertAsync(1, NewRequest());

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(404);
    }

    [Fact]
    public async Task Upsert_com_mes_invalido_lanca_erro()
    {
        var act = () => _service.UpsertAsync(1, NewRequest() with { Month = 13 });

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(400);
    }

    [Fact]
    public async Task Listar_calcula_status_por_categoria_do_periodo()
    {
        var category = ExpenseCategory();
        var budgets = new List<Budget>
        {
            new() { CategoryId = 5, LimitValue = 400m, PeriodMonth = 10, PeriodYear = 2026, Category = category }
        };
        _budgetRepository.Setup(r => r.ListByPeriodAsync(1, 10, 2026)).ReturnsAsync(budgets);
        _transactionRepository
            .Setup(r => r.SumByCategoryAsync(1, TransactionType.Expense, new DateTime(2026, 10, 1), new DateTime(2026, 11, 1)))
            .ReturnsAsync(new List<CategorySum> { new(5, 480m) });

        var result = await _service.ListAsync(1, 10, 2026);

        var item = result.Should().ContainSingle().Subject;
        item.CategoryName.Should().Be("Alimentação");
        item.Spent.Should().Be(480m);
        item.Status.Should().Be("over");
    }
}
