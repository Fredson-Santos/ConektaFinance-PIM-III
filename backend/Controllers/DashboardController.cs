using Microsoft.AspNetCore.Mvc;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Services;

namespace PIM_III_Backend.Controllers;

public class DashboardController(IDashboardService dashboardService) : BaseApiController
{
    [HttpGet("overview")]
    public async Task<ActionResult<DashboardOverviewResponse>> Overview(
        [FromQuery] int? month, [FromQuery] int? year) =>
        Ok(await dashboardService.GetOverviewAsync(CurrentUserId, month, year));

    [HttpGet("weekly-expenses")]
    public async Task<ActionResult<WeeklyExpensesResponse>> WeeklyExpenses([FromQuery] DateTime? date) =>
        Ok(await dashboardService.GetWeeklyExpensesAsync(CurrentUserId, date));

    [HttpGet("recent-transactions")]
    public async Task<ActionResult<List<TransactionResponse>>> RecentTransactions([FromQuery] int limit = 5) =>
        Ok(await dashboardService.GetRecentTransactionsAsync(CurrentUserId, limit));

    [HttpGet("budget-meters")]
    public async Task<ActionResult<List<BudgetMeterResponse>>> BudgetMeters(
        [FromQuery] int? month, [FromQuery] int? year, [FromQuery] int top = 4) =>
        Ok(await dashboardService.GetBudgetMetersAsync(CurrentUserId, month, year, top));
}
