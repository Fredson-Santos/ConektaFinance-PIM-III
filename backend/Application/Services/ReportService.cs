using PIM_III_Backend.Application.Dtos.Reports;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Application.Services;

public class ReportService : IReportService
{
    private readonly IExpenseRepository _expenseRepository;

    public ReportService(IExpenseRepository expenseRepository)
    {
        _expenseRepository = expenseRepository;
    }

    public async Task<ReportSummaryResponse> GetSummaryAsync(int userId)
    {
        var expenses = await _expenseRepository.GetByUserIdAsync(userId);
        var totalExpenses = expenses.Sum(x => x.Value);
        var highestExpense = expenses.OrderByDescending(x => x.Value).FirstOrDefault();

        return new ReportSummaryResponse(
            0, // TotalIncome (TODO)
            totalExpenses,
            0 - totalExpenses, // Balance (TODO)
            highestExpense?.Value ?? 0,
            highestExpense?.Description ?? "Nenhum gasto"
        );
    }

    public async Task<IEnumerable<CategoryReportResponse>> GetByCategoryAsync(int userId)
    {
        var expenses = await _expenseRepository.GetByUserIdAsync(userId);
        var total = expenses.Sum(x => x.Value);
        if (total == 0) return Enumerable.Empty<CategoryReportResponse>();

        return expenses
            .GroupBy(x => new { x.CategoryId, x.Category.Name })
            .Select(g => new CategoryReportResponse(
                g.Key.CategoryId,
                g.Key.Name,
                g.Sum(x => x.Value),
                (double)(g.Sum(x => x.Value) / total * 100)
            ))
            .OrderByDescending(x => x.TotalValue);
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
