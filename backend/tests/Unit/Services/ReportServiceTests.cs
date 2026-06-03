using FluentAssertions;
using Moq;
using PIM_III_Backend.Application.Services;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Interfaces;
using Xunit;

namespace PIM_III_Backend.Tests.Unit.Services;

public class ReportServiceTests
{
    private readonly Mock<IExpenseRepository> _expenseRepoMock;
    private readonly Mock<IBudgetRepository> _budgetRepoMock;
    private readonly Mock<IIncomeRepository> _incomeRepoMock;
    private readonly ReportService _service;

    public ReportServiceTests()
    {
        _expenseRepoMock = new Mock<IExpenseRepository>();
        _budgetRepoMock = new Mock<IBudgetRepository>();
        _incomeRepoMock = new Mock<IIncomeRepository>();
        _service = new ReportService(_expenseRepoMock.Object, _budgetRepoMock.Object, _incomeRepoMock.Object);
    }

    [Fact]
    public async Task GetSummaryAsync_Should_Calculate_Correct_Totals()
    {
        // Arrange
        var userId = 1;
        var expenses = new List<Expense>
        {
            new Expense { Value = 100, Description = "Gasto 1" },
            new Expense { Value = 250, Description = "Gasto 2" },
            new Expense { Value = 50, Description = "Gasto 3" }
        };
        _expenseRepoMock
            .Setup(x => x.GetByUserIdAsync(userId, It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), null))
            .ReturnsAsync(expenses);
        _budgetRepoMock.Setup(x => x.GetByUserIdAsync(userId)).ReturnsAsync(new List<Budget>());
        _incomeRepoMock
            .Setup(x => x.GetByUserIdAsync(userId, It.IsAny<DateTime?>(), It.IsAny<DateTime?>()))
            .ReturnsAsync(new List<Income>());

        // Act
        var result = await _service.GetSummaryAsync(userId);

        // Assert
        result.TotalSpent.Should().Be(400);
        result.LargestExpense.Should().NotBeNull();
        result.LargestExpense!.Amount.Should().Be(250);
        result.LargestExpense.Description.Should().Be("Gasto 2");
    }

    [Fact]
    public async Task GetByCategoryAsync_Should_Calculate_Percentages()
    {
        // Arrange
        var userId = 1;
        var expenses = new List<Expense>
        {
            new Expense { Value = 100, CategoryId = 1, Category = new Category { Name = "Alimentação" } },
            new Expense { Value = 300, CategoryId = 2, Category = new Category { Name = "Transporte" } }
        };
        _expenseRepoMock
            .Setup(x => x.GetByUserIdAsync(userId, It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), null))
            .ReturnsAsync(expenses);
        _budgetRepoMock.Setup(x => x.GetByUserIdAsync(userId)).ReturnsAsync(new List<Budget>());
        _incomeRepoMock
            .Setup(x => x.GetByUserIdAsync(userId, It.IsAny<DateTime?>(), It.IsAny<DateTime?>()))
            .ReturnsAsync(new List<Income>());

        // Act
        var result = await _service.GetByCategoryAsync(userId);

        // Assert
        result.Should().HaveCount(2);
        result.First(x => x.CategoryName == "Transporte").PercentageUsed.Should().Be(75);
        result.First(x => x.CategoryName == "Alimentação").PercentageUsed.Should().Be(25);
    }
}
