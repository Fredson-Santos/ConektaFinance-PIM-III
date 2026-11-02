using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Domain.Interfaces;
using PIM_III_Backend.Domain.Models;

namespace PIM_III_Backend.Application.Services;

public class DashboardService(
    IUserRepository userRepository,
    ITransactionRepository transactionRepository,
    IBudgetRepository budgetRepository) : IDashboardService
{
    private static readonly string[] WeekdayLabels = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];

    public async Task<DashboardOverviewResponse> GetOverviewAsync(int userId, int? month, int? year)
    {
        var now = DateTime.UtcNow;
        var effectiveMonth = month ?? now.Month;
        var effectiveYear = year ?? now.Year;
        var start = new DateTime(effectiveYear, effectiveMonth, 1);
        var end = start.AddMonths(1);
        var previousStart = start.AddMonths(-1);

        var user = await userRepository.GetByIdAsync(userId);
        var monthlyCeiling = user?.MonthlyCeiling ?? 0m;
        var currency = user?.Currency ?? "BRL";

        var income = await transactionRepository.SumAsync(userId, TransactionType.Income, start, end);
        var expense = await transactionRepository.SumAsync(userId, TransactionType.Expense, start, end);
        var previousIncome = await transactionRepository.SumAsync(userId, TransactionType.Income, previousStart, start);
        var previousExpense = await transactionRepository.SumAsync(userId, TransactionType.Expense, previousStart, start);

        return new DashboardOverviewResponse(
            income - expense,
            income,
            expense,
            monthlyCeiling > 0 ? Math.Round((double)(expense / monthlyCeiling) * 100, 1) : null,
            ChangePct(income, previousIncome),
            ChangePct(expense, previousExpense),
            currency,
            now);
    }

    public async Task<WeeklyExpensesResponse> GetWeeklyExpensesAsync(int userId, DateTime? date)
    {
        var reference = date?.Date ?? DateTime.UtcNow.Date;
        var monday = reference.AddDays(-(((int)reference.DayOfWeek + 6) % 7));
        var sums = await transactionRepository.SumByDayAsync(userId, TransactionType.Expense, monday, monday.AddDays(7));
        var byDate = sums.ToDictionary(s => s.Date, s => s.Total);

        var days = new List<WeeklyDayResponse>();
        decimal total = 0;
        var values = new decimal[7];
        for (var i = 0; i < 7; i++)
        {
            values[i] = byDate.GetValueOrDefault(monday.AddDays(i), 0m);
            total += values[i];
        }
        var max = values.Max();
        for (var i = 0; i < 7; i++)
            days.Add(new WeeklyDayResponse(WeekdayLabels[i], values[i], max > 0 ? Math.Round((double)(values[i] / max) * 100) : 0));

        return new WeeklyExpensesResponse(total, Math.Round(total / 7m, 2), days);
    }

    public async Task<List<TransactionResponse>> GetRecentTransactionsAsync(int userId, int limit)
    {
        var filter = new TransactionFilter
        {
            UserId = userId,
            Page = 1,
            PageSize = Math.Clamp(limit, 1, 20),
            SortBy = "transactionDate",
            Order = "desc"
        };
        var result = await transactionRepository.GetPagedAsync(filter);
        return result.Items.Select(TransactionService.MapResponse).ToList();
    }

    public async Task<List<BudgetMeterResponse>> GetBudgetMetersAsync(int userId, int? month, int? year, int top)
    {
        var now = DateTime.UtcNow;
        var effectiveMonth = month ?? now.Month;
        var effectiveYear = year ?? now.Year;
        var start = new DateTime(effectiveYear, effectiveMonth, 1);
        var budgets = await budgetRepository.ListByPeriodAsync(userId, effectiveMonth, effectiveYear);
        if (budgets.Count == 0)
            return [];

        var sums = await transactionRepository.SumByCategoryAsync(userId, TransactionType.Expense, start, start.AddMonths(1));
        var spentByCategory = sums.ToDictionary(s => s.CategoryId, s => s.Total);

        return budgets
            .Where(b => b.Category.Kind == CategoryKind.Expense)
            .Select(b => new BudgetMeterResponse(
                b.CategoryId,
                b.Category.Name,
                b.Category.ColorCode,
                b.Category.Icon,
                spentByCategory.GetValueOrDefault(b.CategoryId, 0m),
                b.LimitValue,
                Math.Round(BudgetStatus.PercentageUsed(spentByCategory.GetValueOrDefault(b.CategoryId, 0m), b.LimitValue), 1)))
            .OrderByDescending(m => m.Percentage)
            .ThenBy(m => m.Name)
            .Take(Math.Clamp(top, 1, 20))
            .ToList();
    }

    private static double? ChangePct(decimal current, decimal previous) =>
        previous == 0 ? null : Math.Round((double)(current - previous) / (double)previous * 100, 1);
}
