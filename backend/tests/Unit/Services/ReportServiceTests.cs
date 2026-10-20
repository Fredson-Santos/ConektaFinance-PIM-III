using FluentAssertions;
using Moq;
using PIM_III_Backend.Application.Services;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Tests.Unit.Services;

public class ReportServiceTests
{
    private readonly Mock<ITransactionRepository> _transactionRepository = new();
    private readonly Mock<ICategoryRepository> _categoryRepository = new();
    private readonly ReportService _service;

    public ReportServiceTests() =>
        _service = new ReportService(_transactionRepository.Object, _categoryRepository.Object);

    private void SetupSums(decimal income, decimal expense)
    {
        _transactionRepository
            .Setup(r => r.SumAsync(1, TransactionType.Income, It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<int?>()))
            .ReturnsAsync(income);
        _transactionRepository
            .Setup(r => r.SumAsync(1, TransactionType.Expense, It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<int?>()))
            .ReturnsAsync(expense);
    }

    [Fact]
    public async Task Resumo_calcula_saldo_taxa_de_poupanca_e_media_mensal()
    {
        SetupSums(1000m, 400m);
        _transactionRepository.Setup(r => r.GetLargestExpenseAsync(1, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(new Transaction { Value = 250m, Description = "Mercado", TransactionDate = DateTime.UtcNow });
        _transactionRepository.Setup(r => r.SumRecurrentAsync(1, TransactionType.Expense, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(39.90m);
        _transactionRepository.Setup(r => r.CountRecurrentAsync(1, TransactionType.Expense, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(1);

        var summary = await _service.GetSummaryAsync(1, new DateTime(2026, 5, 1), new DateTime(2026, 11, 1));

        summary.TotalIncome.Should().Be(1000m);
        summary.TotalExpense.Should().Be(400m);
        summary.Balance.Should().Be(600m);
        summary.SavingsRate.Should().Be(60);
        summary.AverageMonthlyExpense.Should().BeApproximately(66.67m, 0.01m);
        summary.LargestExpense!.Amount.Should().Be(250m);
        summary.RecurrentSpent.Should().Be(39.90m);
        summary.RecurrentCount.Should().Be(1);
        summary.PreviousPeriod.Should().NotBeNull();
    }

    [Fact]
    public async Task Por_categoria_calcula_percentuais_e_une_com_nomes()
    {
        var period = (new DateTime(2026, 10, 1), new DateTime(2026, 11, 1));
        _transactionRepository
            .Setup(r => r.SumByCategoryAsync(1, TransactionType.Expense, period.Item1, period.Item2))
            .ReturnsAsync(new List<CategorySum> { new(5, 300m), new(6, 100m) });
        _categoryRepository.Setup(r => r.ListAsync(1, Domain.Enums.CategoryKind.Expense)).ReturnsAsync(new List<Category>
        {
            new() { Id = 5, Name = "Alimentação", ColorCode = "#ef4444", Icon = "Utensils" },
            new() { Id = 6, Name = "Transporte", ColorCode = "#0070f3", Icon = "Car" }
        });

        var result = await _service.GetByCategoryAsync(1, period.Item1, period.Item2, TransactionType.Expense);

        result.Should().HaveCount(2);
        result[0].Name.Should().Be("Alimentação");
        result[0].Percentage.Should().Be(75);
        result[1].Percentage.Should().Be(25);
    }

    [Fact]
    public async Task Tendencia_retorna_meses_solicitados_com_saldo_guardado()
    {
        SetupSums(5000m, 3000m);

        var trend = await _service.GetTrendAsync(1, 6);

        trend.Should().HaveCount(6);
        trend.Should().OnlyContain(t => t.Income == 5000m && t.Expense == 3000m && t.Saved == 2000m);
        trend[0].Period.Should().MatchRegex(@"^\d{2}/\d{4}$");
    }

    [Fact]
    public async Task Diario_preenche_dias_sem_gasto_com_zero()
    {
        _transactionRepository
            .Setup(r => r.SumByDayAsync(1, TransactionType.Expense, new DateTime(2026, 10, 1), new DateTime(2026, 11, 1)))
            .ReturnsAsync(new List<DailySum> { new(new DateTime(2026, 10, 15), 90m) });

        var daily = await _service.GetDailyAsync(1, new DateTime(2026, 10, 1), new DateTime(2026, 11, 1));

        daily.Should().HaveCount(31);
        daily[14].Day.Should().Be("15");
        daily[14].Value.Should().Be(90m);
        daily[0].Value.Should().Be(0m);
    }

    [Fact]
    public async Task Periodo_com_fim_antes_do_inicio_lanca_400()
    {
        var act = () => _service.GetSummaryAsync(1, new DateTime(2026, 10, 10), new DateTime(2026, 10, 1));
        var exception = await act.Should().ThrowAsync<PIM_III_Backend.Application.Exceptions.AppException>();
        exception.Which.StatusCode.Should().Be(400);
    }
}
