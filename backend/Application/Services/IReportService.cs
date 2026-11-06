using ConektaFinance.Api.Application.Dtos;
using ConektaFinance.Api.Domain.Enums;

namespace ConektaFinance.Api.Application.Services;

public interface IReportService
{
    Task<ReportSummaryResponse> GetSummaryAsync(int userId, DateTime? start, DateTime? end);
    Task<List<CategoryReportResponse>> GetByCategoryAsync(int userId, DateTime? start, DateTime? end, TransactionType kind);
    Task<List<TrendReportResponse>> GetTrendAsync(int userId, int months);
    Task<List<DailyExpenseReportResponse>> GetDailyAsync(int userId, DateTime? start, DateTime? end);
    Task<PeriodExportResponse> GetExportAsync(int userId, DateTime? start, DateTime? end);
    Task<MonthlyClosingResponse> CloseMonthAsync(int userId, int year, int month);
}
