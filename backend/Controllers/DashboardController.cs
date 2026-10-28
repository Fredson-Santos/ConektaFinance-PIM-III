using Microsoft.AspNetCore.Mvc;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Services;

namespace PIM_III_Backend.Controllers;

/// <summary>
/// Indicadores agregados da tela inicial.
/// </summary>
[Tags("Dashboard")]
public class DashboardController(IDashboardService dashboardService) : BaseApiController
{
    /// <summary>Saldo, receitas, despesas e uso do teto do mês, com comparativo ao mês anterior.</summary>
    [ProducesResponseType<DashboardOverviewResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [HttpGet("overview")]
    public async Task<ActionResult<DashboardOverviewResponse>> Overview(
        [FromQuery] int? month, [FromQuery] int? year) =>
        Ok(await dashboardService.GetOverviewAsync(CurrentUserId, month, year));

    /// <summary>Gastos por dia da semana que contém a data informada.</summary>
    [ProducesResponseType<WeeklyExpensesResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [HttpGet("weekly-expenses")]
    public async Task<ActionResult<WeeklyExpensesResponse>> WeeklyExpenses([FromQuery] DateTime? date) =>
        Ok(await dashboardService.GetWeeklyExpensesAsync(CurrentUserId, date));

    /// <summary>Últimos lançamentos do usuário.</summary>
    [ProducesResponseType<List<TransactionResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [HttpGet("recent-transactions")]
    public async Task<ActionResult<List<TransactionResponse>>> RecentTransactions([FromQuery] int limit = 5) =>
        Ok(await dashboardService.GetRecentTransactionsAsync(CurrentUserId, limit));

    /// <summary>Medidores das categorias com teto mais consumido no mês.</summary>
    [ProducesResponseType<List<BudgetMeterResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [HttpGet("budget-meters")]
    public async Task<ActionResult<List<BudgetMeterResponse>>> BudgetMeters(
        [FromQuery] int? month, [FromQuery] int? year, [FromQuery] int top = 4) =>
        Ok(await dashboardService.GetBudgetMetersAsync(CurrentUserId, month, year, top));
}
