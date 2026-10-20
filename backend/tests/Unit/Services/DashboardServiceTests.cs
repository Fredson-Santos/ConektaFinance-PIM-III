using FluentAssertions;
using Moq;
using PIM_III_Backend.Application.Services;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Tests.Unit.Services;

public class DashboardServiceTests
{
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly Mock<ITransactionRepository> _transactionRepository = new();
    private readonly Mock<IBudgetRepository> _budgetRepository = new();
    private readonly DashboardService _service;

    public DashboardServiceTests() =>
        _service = new DashboardService(_userRepository.Object, _transactionRepository.Object, _budgetRepository.Object);

    private void SetupUser(decimal ceiling = 6350m) =>
        _userRepository.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(new User { Id = 1, MonthlyCeiling = ceiling });

    [Fact]
    public async Task Overview_calcula_saldo_e_variacoes_comparadas_ao_mes_anterior()
    {
        SetupUser();
        var now = DateTime.UtcNow;
        var start = new DateTime(now.Year, now.Month, 1);
        var previousStart = start.AddMonths(-1);
        var allStart = new DateTime(2000, 1, 1);
        var allEnd = new DateTime(2100, 1, 1);
        _transactionRepository.Setup(r => r.SumAsync(1, TransactionType.Income, start, start.AddMonths(1), null)).ReturnsAsync(1000m);
        _transactionRepository.Setup(r => r.SumAsync(1, TransactionType.Expense, start, start.AddMonths(1), null)).ReturnsAsync(400m);
        _transactionRepository.Setup(r => r.SumAsync(1, TransactionType.Income, previousStart, start, null)).ReturnsAsync(800m);
        _transactionRepository.Setup(r => r.SumAsync(1, TransactionType.Expense, previousStart, start, null)).ReturnsAsync(500m);
        _transactionRepository.Setup(r => r.SumAsync(1, TransactionType.Income, allStart, allEnd, null)).ReturnsAsync(1000m);
        _transactionRepository.Setup(r => r.SumAsync(1, TransactionType.Expense, allStart, allEnd, null)).ReturnsAsync(400m);

        var overview = await _service.GetOverviewAsync(1, null, null);

        overview.Balance.Should().Be(600m);
        overview.Income.Should().Be(1000m);
        overview.Expense.Should().Be(400m);
        overview.IncomeChangePct.Should().Be(25);
        overview.ExpenseChangePct.Should().Be(-20);
        overview.ExpenseToCeilingPercentage.Should().BeApproximately(6.3, 0.1);
    }

    [Fact]
    public async Task Overview_com_teto_zero_retorna_percentual_nulo()
    {
        SetupUser(0m);
        _transactionRepository.Setup(r => r.SumAsync(It.IsAny<int>(), It.IsAny<TransactionType>(), It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<int?>()))
            .ReturnsAsync(0m);

        var overview = await _service.GetOverviewAsync(1, null, null);

        overview.ExpenseToCeilingPercentage.Should().BeNull();
    }

    [Fact]
    public async Task Semana_agrupa_sete_dias_com_percentual_relativo_ao_pico()
    {
        var monday = DateTime.UtcNow.Date.AddDays(-(((int)DateTime.UtcNow.Date.DayOfWeek + 6) % 7));
        _transactionRepository
            .Setup(r => r.SumByDayAsync(1, TransactionType.Expense, monday, monday.AddDays(7)))
            .ReturnsAsync(new List<DailySum> { new(monday, 90m), new(monday.AddDays(3), 45m) });

        var week = await _service.GetWeeklyExpensesAsync(1, null);

        week.Days.Should().HaveCount(7);
        week.Days[0].Weekday.Should().Be("seg");
        week.Days[6].Weekday.Should().Be("dom");
        week.Total.Should().Be(135m);
        week.DailyAverage.Should().BeApproximately(19.29m, 0.01m);
        week.Days[0].Percentage.Should().Be(100);
        week.Days[3].Percentage.Should().Be(50);
        week.Days[1].Percentage.Should().Be(0);
    }

    [Fact]
    public async Task Medidores_ordenam_por_percentual_e_limitam_o_top()
    {
        var now = DateTime.UtcNow;
        var category = new Category { Id = 5, Name = "Alimentação", ColorCode = "#ef4444", Icon = "Utensils", Kind = CategoryKind.Expense };
        _budgetRepository.Setup(r => r.ListByPeriodAsync(1, now.Month, now.Year)).ReturnsAsync(new List<Budget>
        {
            new() { CategoryId = 5, LimitValue = 500m, Category = category }
        });
        _transactionRepository
            .Setup(r => r.SumByCategoryAsync(1, TransactionType.Expense, new DateTime(now.Year, now.Month, 1), It.IsAny<DateTime>()))
            .ReturnsAsync(new List<CategorySum> { new(5, 900m) });

        var meters = await _service.GetBudgetMetersAsync(1, null, null, 4);

        var meter = meters.Should().ContainSingle().Subject;
        meter.Name.Should().Be("Alimentação");
        meter.Percentage.Should().Be(180);
    }
}
