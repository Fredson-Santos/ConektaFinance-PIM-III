using PIM_III_Backend.Application.Dtos.Reports;
using PIM_III_Backend.Application.Dtos.Alerts;
using PIM_III_Backend.Application.Dtos.Insights;

namespace PIM_III_Backend.Application.Services;

public interface IReportService
{
    Task<ReportSummaryResponse> GetSummaryAsync(int userId);
    Task<IEnumerable<CategoryReportResponse>> GetByCategoryAsync(int userId);
    Task<IEnumerable<TrendReportResponse>> GetTrendAsync(int userId);
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
