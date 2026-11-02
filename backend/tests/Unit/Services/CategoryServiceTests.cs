using FluentAssertions;
using Moq;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Exceptions;
using PIM_III_Backend.Application.Services;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Tests.Unit.Services;

public class CategoryServiceTests
{
    private readonly Mock<ICategoryRepository> _categoryRepository = new();
    private readonly Mock<IBudgetRepository> _budgetRepository = new();
    private readonly Mock<ITransactionRepository> _transactionRepository = new();
    private readonly CategoryService _service;

    public CategoryServiceTests() =>
        _service = new CategoryService(_categoryRepository.Object, _budgetRepository.Object, _transactionRepository.Object);

    [Fact]
    public async Task Criar_categoria_com_nome_duplicado_lanca_conflito()
    {
        _categoryRepository.Setup(r => r.ExistsNameAsync(1, "Lazer", null)).ReturnsAsync(true);

        var act = () => _service.CreateAsync(1, new CreateCategoryRequest("Lazer", null, "#00cc88", "Film", CategoryKind.Expense));

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(409);
    }

    [Fact]
    public async Task Criar_categoria_valida_usa_icone_padrao_quando_vazio()
    {
        Category? captured = null;
        _categoryRepository.Setup(r => r.ExistsNameAsync(1, "Pets", null)).ReturnsAsync(false);
        _categoryRepository.Setup(r => r.AddAsync(It.IsAny<Category>())).Callback<Category>(c => captured = c);

        var response = await _service.CreateAsync(1, new CreateCategoryRequest("Pets", "Pet shop e racao", "#ef4444", "", CategoryKind.Expense));

        response.Name.Should().Be("Pets");
        captured!.Icon.Should().Be("Tag");
        captured.UserId.Should().Be(1);
    }

    [Fact]
    public async Task Excluir_categoria_com_lancamentos_lanca_conflito()
    {
        var category = new Category { Id = 2, UserId = 1, Name = "Lazer" };
        _categoryRepository.Setup(r => r.GetByIdAndUserAsync(2, 1)).ReturnsAsync(category);
        _categoryRepository.Setup(r => r.CountTransactionsAsync(2)).ReturnsAsync(4);

        var act = () => _service.DeleteAsync(1, 2);

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(409);
    }

    [Fact]
    public async Task Excluir_categoria_de_outro_usuario_lanca_nao_encontrado()
    {
        _categoryRepository.Setup(r => r.GetByIdAndUserAsync(2, 1)).ReturnsAsync((Category?)null);

        var act = () => _service.DeleteAsync(1, 2);

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(404);
    }

    [Fact]
    public async Task Listar_com_periodo_retorna_gasto_teto_e_status()
    {
        var categories = new List<Category>
        {
            new() { Id = 10, UserId = 1, Name = "Alimentação", Kind = CategoryKind.Expense },
            new() { Id = 20, UserId = 1, Name = "Salário", Kind = CategoryKind.Income }
        };
        _categoryRepository.Setup(r => r.ListAsync(1, CategoryKind.Expense)).ReturnsAsync(categories);
        _budgetRepository.Setup(r => r.ListByPeriodAsync(1, 10, 2026)).ReturnsAsync(new List<Budget>
        {
            new() { CategoryId = 10, LimitValue = 1000m, Category = new Category { Kind = CategoryKind.Expense } }
        });
        var now = DateTime.UtcNow;
        _transactionRepository
            .Setup(r => r.SumByCategoryAsync(1, TransactionType.Expense, new DateTime(2026, 10, 1), new DateTime(2026, 11, 1)))
            .ReturnsAsync(new List<CategorySum> { new(10, 850m) });

        var result = await _service.ListAsync(1, "expense", 10, 2026);

        var alimentacao = result.Should().ContainSingle(c => c.Id == 10).Subject;
        alimentacao.Spent.Should().Be(850m);
        alimentacao.Limit.Should().Be(1000m);
        alimentacao.Status.Should().Be("warn");
    }

    [Fact]
    public async Task Listar_sem_periodo_nao_calcula_gastos()
    {
        _categoryRepository.Setup(r => r.ListAsync(1, null)).ReturnsAsync([]);

        var result = await _service.ListAsync(1, null, null, null);

        result.Should().BeEmpty();
        _transactionRepository.Verify(r => r.SumByCategoryAsync(It.IsAny<int>(), It.IsAny<TransactionType>(), It.IsAny<DateTime>(), It.IsAny<DateTime>()), Times.Never);
    }
}
