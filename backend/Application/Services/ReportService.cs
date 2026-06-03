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

    public async Task<ReportSummaryResponse> GetSummaryAsync(int userId, DateTime? start = null, DateTime? end = null)
    {
        var now = DateTime.UtcNow;

        // Se não fornecer datas, usar o mês atual
        if (!start.HasValue || !end.HasValue)
        {
            start = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            end = start.Value.AddMonths(1).AddTicks(-1);
        }

        var expenses = await _expenseRepository.GetByUserIdAsync(userId, start, end);
        var totalSpent = expenses.Sum(x => x.Value);
        var highestExpense = expenses.OrderByDescending(x => x.Value).FirstOrDefault();

        var budgets = await _budgetRepository.GetByUserIdAsync(userId);
        // BUG 2.2 CORRIGIDO: Só usar orçamentos do período atual.
        // Se não há orçamento definido para o mês, totalBudget = 0 (comportamento correto).
        var currentBudgets = budgets
            .Where(x => x.PeriodYear == start.Value.Year && x.PeriodMonth == start.Value.Month)
            .ToList();
        var totalBudget = currentBudgets.Sum(x => x.LimitValue);

        var incomes = await _incomeRepository.GetByUserIdAsync(userId, start, end);
        var totalIncome = incomes.Sum(x => x.Amount);

        totalBudget += totalIncome;

        var remainingBudget = totalBudget - totalSpent;
        var overallPercentage = totalBudget > 0 ? (double)(totalSpent / totalBudget * 100) : 0;

        var recurrentExpenses = expenses.Where(x => x.IsRecurrent).ToList();
        var recurrentSpent = recurrentExpenses.Sum(x => x.Value);
        var recurrentCount = recurrentExpenses.Count;

        return new ReportSummaryResponse(
            totalBudget,
            totalSpent,
            remainingBudget,
            overallPercentage,
            highestExpense != null ? new LargestExpenseDto(highestExpense.Value, highestExpense.Description) : null,
            recurrentSpent,
            recurrentCount
        );
    }

    public async Task<IEnumerable<CategoryReportResponse>> GetByCategoryAsync(int userId, DateTime? start = null, DateTime? end = null)
    {
        var now = DateTime.UtcNow;

        // Se não fornecer datas, usar o mês atual
        if (!start.HasValue || !end.HasValue)
        {
            start = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            end = start.Value.AddMonths(1).AddTicks(-1);
        }

        var expenses = await _expenseRepository.GetByUserIdAsync(userId, start, end);
        var budgets = await _budgetRepository.GetByUserIdAsync(userId);

        // BUG 2.2 CORRIGIDO: Só usar orçamentos do período selecionado, sem fallback histórico.
        var currentBudgets = budgets
            .Where(x => x.PeriodYear == start.Value.Year && x.PeriodMonth == start.Value.Month)
            .ToList();

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

    public async Task<IEnumerable<TrendReportResponse>> GetTrendAsync(int userId, DateTime? start = null, DateTime? end = null)
    {
        var expenses = await _expenseRepository.GetByUserIdAsync(userId);

        // Se fornecer datas, filtrar pelo intervalo
        if (start.HasValue && end.HasValue)
        {
            expenses = expenses.Where(x => x.TransactionDate >= start.Value && x.TransactionDate <= end.Value).ToList();
        }

        return expenses
            .GroupBy(x => new { x.TransactionDate.Year, x.TransactionDate.Month })
            .Select(g => new TrendReportResponse(
                $"{g.Key.Month:D2}/{g.Key.Year}",
                g.Sum(x => x.Value)
            ))
            .OrderBy(x => x.Period)
            .TakeLast(6);
    }

    public async Task<IEnumerable<DailyExpenseReportResponse>> GetDailyAsync(int userId, DateTime? start = null, DateTime? end = null)
    {
        var now = DateTime.UtcNow;

        // Se não fornecer datas, usar o mês atual
        if (!start.HasValue || !end.HasValue)
        {
            start = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            end = start.Value.AddMonths(1).AddTicks(-1);
        }

        var expenses = await _expenseRepository.GetByUserIdAsync(userId, start, end);

        // Gerar todos os dias do período para que dias sem gasto apareçam como 0
        var totalDays = (int)(end.Value.Date - start.Value.Date).TotalDays + 1;
        var allDays = Enumerable.Range(0, totalDays)
            .Select(i => start.Value.Date.AddDays(i))
            .ToList();

        var expensesByDay = expenses
            .GroupBy(x => x.TransactionDate.Date)
            .ToDictionary(g => g.Key, g => g.Sum(x => x.Value));

        return allDays.Select(day => new DailyExpenseReportResponse(
            day.Day.ToString("D2"),
            expensesByDay.TryGetValue(day, out var val) ? val : 0
        ));
    }
}
