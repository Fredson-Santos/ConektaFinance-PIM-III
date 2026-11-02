using FluentAssertions;
using Moq;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Exceptions;
using PIM_III_Backend.Application.Services;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Domain.Interfaces;
using PIM_III_Backend.Domain.Models;

namespace PIM_III_Backend.Tests.Unit.Services;

public class TransactionServiceTests
{
    private readonly Mock<ITransactionRepository> _transactionRepository = new();
    private readonly Mock<ICategoryRepository> _categoryRepository = new();
    private readonly Mock<IAlertService> _alertService = new();
    private readonly TransactionService _service;

    public TransactionServiceTests() =>
        _service = new TransactionService(_transactionRepository.Object, _categoryRepository.Object, _alertService.Object);

    private static Domain.Entities.Category ExpenseCategory(int id = 5) =>
        new() { Id = id, UserId = 1, Name = "Alimentação", Kind = CategoryKind.Expense };

    private CreateTransactionRequest NewRequest(TransactionType type, int categoryId = 5) =>
        new(type, categoryId, "Compra teste", 100m, DateTime.UtcNow.AddDays(-1), null, null, null);

    [Fact]
    public async Task Criar_despesa_dispara_verificacao_de_alertas()
    {
        _categoryRepository.Setup(r => r.GetByIdAndUserAsync(5, 1)).ReturnsAsync(ExpenseCategory());
        var captured = new List<Transaction>();
        _transactionRepository.Setup(r => r.AddAsync(Capture.In(captured)));

        await _service.CreateAsync(1, NewRequest(TransactionType.Expense));

        captured.Should().HaveCount(1);
        captured[0].Type.Should().Be(TransactionType.Expense);
        _alertService.Verify(a => a.CheckBudgetAlertsAsync(1, 5, It.IsAny<int>(), It.IsAny<int>()), Times.Once);
    }

    [Fact]
    public async Task Criar_entrada_nao_dispara_alertas()
    {
        _categoryRepository.Setup(r => r.GetByIdAndUserAsync(7, 1))
            .ReturnsAsync(new Domain.Entities.Category { Id = 7, UserId = 1, Kind = CategoryKind.Income });

        await _service.CreateAsync(1, NewRequest(TransactionType.Income, 7));

        _alertService.Verify(a => a.CheckBudgetAlertsAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task Criar_com_categoria_incompativel_lanca_erro_de_tipo()
    {
        _categoryRepository.Setup(r => r.GetByIdAndUserAsync(5, 1)).ReturnsAsync(ExpenseCategory());

        var act = () => _service.CreateAsync(1, NewRequest(TransactionType.Income));

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(400);
    }

    [Fact]
    public async Task Criar_com_categoria_de_outro_usuario_lanca_nao_encontrado()
    {
        _categoryRepository.Setup(r => r.GetByIdAndUserAsync(5, 1)).ReturnsAsync((Domain.Entities.Category?)null);

        var act = () => _service.CreateAsync(1, NewRequest(TransactionType.Expense));

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(404);
    }

    [Fact]
    public async Task Criar_com_data_futura_lanca_erro()
    {
        _categoryRepository.Setup(r => r.GetByIdAndUserAsync(5, 1)).ReturnsAsync(ExpenseCategory());
        var request = NewRequest(TransactionType.Expense) with { TransactionDate = DateTime.UtcNow.AddDays(2) };

        var act = () => _service.CreateAsync(1, request);

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(400);
    }

    [Fact]
    public async Task Atualizar_lancamento_de_outro_usuario_lanca_nao_encontrado()
    {
        _transactionRepository.Setup(r => r.GetByIdAsync(10))
            .ReturnsAsync(new Transaction { Id = 10, UserId = 99 });

        var act = () => _service.UpdateAsync(1, 10, new UpdateTransactionRequest(
            TransactionType.Expense, 5, "X", 10m, DateTime.UtcNow.AddDays(-1), null, null, null, null));

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(404);
    }

    [Fact]
    public async Task Excluir_remove_lancamento_do_proprio_usuario()
    {
        var transaction = new Transaction { Id = 10, UserId = 1, Category = ExpenseCategory() };
        _transactionRepository.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(transaction);

        await _service.DeleteAsync(1, 10);

        _transactionRepository.Verify(r => r.DeleteAsync(transaction), Times.Once);
    }

    [Fact]
    public async Task Listar_normaliza_paginacao_e_busca()
    {
        TransactionFilter? captured = null;
        _transactionRepository
            .Setup(r => r.GetPagedAsync(Capture.In(new List<TransactionFilter>())))
            .Callback<TransactionFilter>(f => captured = f)
            .ReturnsAsync(new PagedResult<Transaction>([], 0, 1, 20));

        await _service.ListAsync(new TransactionFilter
        {
            UserId = 1, Page = 0, PageSize = 500, Search = "  Mercado  "
        });

        captured!.Page.Should().Be(1);
        captured.PageSize.Should().Be(100);
        captured.Search.Should().Be("mercado");
    }
}
