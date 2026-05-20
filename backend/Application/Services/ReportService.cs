using PIM_III_Backend.Application.Dtos.Reports;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Application.Services;

public class ReportService : IReportService
{
    private readonly IExpenseRepository _expenseRepository;
    private readonly IBudgetRepository _budgetRepository;
    private readonly IIncomeRepository _incomeRepository;

    public ReportService(IExpenseRepository expenseRepository, IBudgetRepository budgetRepository, IIncomeRepository incomeRepository)
    {
        _expenseRepository = expenseRepository;
        _budgetRepository = budgetRepository;
        _incomeRepository = incomeRepository;
    }

    public async Task<ReportSummaryResponse> GetSummaryAsync(int userId)
    {
        var now = DateTime.UtcNow;
        var expenses = await _expenseRepository.GetByUserIdAsync(userId);
        var currentMonthExpenses = expenses.Where(x => x.TransactionDate.Year == now.Year && x.TransactionDate.Month == now.Month).ToList();
        var totalSpent = currentMonthExpenses.Sum(x => x.Value);
        if (!currentMonthExpenses.Any() && expenses.Any()) 
        {
            totalSpent = expenses.Sum(x => x.Value);
        }
        var highestExpense = expenses.OrderByDescending(x => x.Value).FirstOrDefault();

        var budgets = await _budgetRepository.GetByUserIdAsync(userId);
        var currentBudgets = budgets.Where(x => x.PeriodYear == now.Year && x.PeriodMonth == now.Month).ToList();
        if (!currentBudgets.Any() && budgets.Any())
        {
            currentBudgets = budgets.ToList();
        }
        var totalBudget = currentBudgets.Sum(x => x.LimitValue);

        var incomes = await _incomeRepository.GetByUserIdAsync(userId);
        var currentMonthIncomes = incomes.Where(x => x.TransactionDate.Year == now.Year && x.TransactionDate.Month == now.Month).ToList();
        if (!currentMonthIncomes.Any() && incomes.Any())
        {
            currentMonthIncomes = incomes.ToList();
        }
        var totalIncome = currentMonthIncomes.Sum(x => x.Amount);

        totalBudget += totalIncome;

        var remainingBudget = totalBudget - totalSpent;
        var overallPercentage = totalBudget > 0 ? (double)(totalSpent / totalBudget * 100) : 0;

        return new ReportSummaryResponse(
            totalBudget,
            totalSpent,
            remainingBudget,
            overallPercentage,
            highestExpense != null ? new LargestExpenseDto(highestExpense.Value, highestExpense.Description) : null
        );
    }

    public async Task<IEnumerable<CategoryReportResponse>> GetByCategoryAsync(int userId)
    {
        var now = DateTime.UtcNow;
        var expenses = await _expenseRepository.GetByUserIdAsync(userId);
        var budgets = await _budgetRepository.GetByUserIdAsync(userId);
        
        var currentBudgets = budgets.Where(x => x.PeriodYear == now.Year && x.PeriodMonth == now.Month).ToList();
        if (!currentBudgets.Any()) currentBudgets = budgets.ToList();

        var expensesByCategory = expenses.GroupBy(x => new { x.CategoryId, x.Category.Name }).ToList();
        var result = new List<CategoryReportResponse>();

        foreach (var g in expensesByCategory)
        {
            var catId = g.Key.CategoryId;
            var catName = g.Key.Name;
            var totalSpent = g.Sum(x => x.Value);
            var budget = currentBudgets.FirstOrDefault(b => b.CategoryId == catId);
            decimal? budgetLimit = budget?.LimitValue;
            
            double percentageUsed = 0;
            if (budgetLimit.HasValue && budgetLimit.Value > 0)
            {
                percentageUsed = (double)(totalSpent / budgetLimit.Value * 100);
            }
            else
            {
                var totalExpenses = expenses.Sum(x => x.Value);
                percentageUsed = totalExpenses > 0 ? (double)(totalSpent / totalExpenses * 100) : 0;
            }

            result.Add(new CategoryReportResponse(catId, catName, totalSpent, budgetLimit, percentageUsed));
        }

        return result.OrderByDescending(x => x.TotalSpent);
    }

    public async Task<IEnumerable<TrendReportResponse>> GetTrendAsync(int userId)
    {
        var expenses = await _expenseRepository.GetByUserIdAsync(userId);
        
        return expenses
            .GroupBy(x => new { x.TransactionDate.Year, x.TransactionDate.Month })
            .Select(g => new TrendReportResponse(
                $"{g.Key.Month:D2}/{g.Key.Year}",
                g.Sum(x => x.Value)
            ))
            .OrderBy(x => x.Period)
            .TakeLast(6);
    }
}
