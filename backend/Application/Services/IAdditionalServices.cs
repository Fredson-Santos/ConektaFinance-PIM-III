using PIM_III_Backend.Application.Dtos.Reports;
using PIM_III_Backend.Application.Dtos.Alerts;
using PIM_III_Backend.Application.Dtos.Insights;
using PIM_III_Backend.Application.Dtos.Incomes;

namespace PIM_III_Backend.Application.Services;

public interface IReportService
{
    Task<ReportSummaryResponse> GetSummaryAsync(int userId, DateTime? start = null, DateTime? end = null);
    Task<IEnumerable<CategoryReportResponse>> GetByCategoryAsync(int userId, DateTime? start = null, DateTime? end = null);
    Task<IEnumerable<TrendReportResponse>> GetTrendAsync(int userId, DateTime? start = null, DateTime? end = null);
}

public interface IAlertService
{
    Task<IEnumerable<AlertResponse>> GetUserAlertsAsync(int userId, bool onlyUnread = false);
    Task MarkAsReadAsync(int id, int userId);
    Task DeleteAsync(int id, int userId);
    Task CheckBudgetAlertsAsync(int userId, int categoryId, decimal currentValue);
}

public interface IInsightService
{
    Task<IEnumerable<InsightResponse>> GetInsightsAsync(int userId);
}

public interface IIncomeService
{
    Task<IEnumerable<IncomeResponse>> GetUserIncomesAsync(int userId, DateTime? start = null, DateTime? end = null);
    Task<IncomeResponse?> GetByIdAsync(int id, int userId);
    Task<IncomeResponse> CreateAsync(int userId, CreateIncomeRequest request);
    Task DeleteAsync(int id, int userId);
}

