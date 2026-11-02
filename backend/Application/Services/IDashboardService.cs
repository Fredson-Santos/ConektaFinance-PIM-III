using PIM_III_Backend.Application.Dtos;

namespace PIM_III_Backend.Application.Services;

public interface IDashboardService
{
    Task<DashboardOverviewResponse> GetOverviewAsync(int userId, int? month, int? year);
    Task<WeeklyExpensesResponse> GetWeeklyExpensesAsync(int userId, DateTime? date);
    Task<List<TransactionResponse>> GetRecentTransactionsAsync(int userId, int limit);
    Task<List<BudgetMeterResponse>> GetBudgetMetersAsync(int userId, int? month, int? year, int top);
}
