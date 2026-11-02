using Microsoft.AspNetCore.Mvc;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Exceptions;
using PIM_III_Backend.Application.Services;
using PIM_III_Backend.Domain.Enums;

namespace PIM_III_Backend.Controllers;

/// <summary>
/// Relatórios consolidados e exportações.
/// </summary>
[Tags("Relatórios")]
public class ReportsController(IReportService reportService) : BaseApiController
{
    /// <summary>Resumo do período: receitas, despesas, saldo, taxa de economia e comparativo.</summary>
    [ProducesResponseType<ReportSummaryResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [HttpGet("summary")]
    public async Task<ActionResult<ReportSummaryResponse>> Summary(
        [FromQuery] DateTime? start, [FromQuery] DateTime? end) =>
        Ok(await reportService.GetSummaryAsync(CurrentUserId, start, end));

    /// <summary>Totais e percentuais por categoria no período.</summary>
    [ProducesResponseType<List<CategoryReportResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [HttpGet("by-category")]
    public async Task<ActionResult<List<CategoryReportResponse>>> ByCategory(
        [FromQuery] string? kind, [FromQuery] DateTime? start, [FromQuery] DateTime? end)
    {
        if (!string.IsNullOrWhiteSpace(kind) && !Enum.TryParse<TransactionType>(kind, ignoreCase: true, out _))
            throw AppException.BadRequest("Tipo invalido", "Use expense ou income.");
        var effectiveKind = Enum.TryParse<TransactionType>(kind, ignoreCase: true, out var parsed)
            ? parsed
            : TransactionType.Expense;
        return Ok(await reportService.GetByCategoryAsync(CurrentUserId, start, end, effectiveKind));
    }

    /// <summary>Evolução mensal de receitas, despesas e saldo.</summary>
    [ProducesResponseType<List<TrendReportResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [HttpGet("trend")]
    public async Task<ActionResult<List<TrendReportResponse>>> Trend([FromQuery] int months = 6) =>
        Ok(await reportService.GetTrendAsync(CurrentUserId, months));

    /// <summary>Gastos por dia no período.</summary>
    [ProducesResponseType<List<DailyExpenseReportResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [HttpGet("daily")]
    public async Task<ActionResult<List<DailyExpenseReportResponse>>> Daily(
        [FromQuery] DateTime? start, [FromQuery] DateTime? end) =>
        Ok(await reportService.GetDailyAsync(CurrentUserId, start, end));

    /// <summary>Fecha o mês com a procedure sp_fechamento_mensal do PostgreSQL e devolve o consolidado.</summary>
    [ProducesResponseType<MonthlyClosingResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [HttpPost("monthly-closing")]
    public async Task<ActionResult<MonthlyClosingResponse>> CloseMonth([FromQuery] int year, [FromQuery] int month) =>
        Ok(await reportService.CloseMonthAsync(CurrentUserId, year, month));

    /// <summary>Exporta os lançamentos do período em CSV (padrão pt-BR).</summary>
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [HttpGet("export.csv")]
    public async Task<IActionResult> ExportCsv([FromQuery] DateTime? start, [FromQuery] DateTime? end)
    {
        var export = await reportService.GetExportAsync(CurrentUserId, start, end);
        var csv = PIM_III_Backend.Application.Services.ReportService.BuildCsv(export);
        var bytes = System.Text.Encoding.UTF8.GetPreamble().Concat(System.Text.Encoding.UTF8.GetBytes(csv)).ToArray();
        return File(bytes, "text/csv; charset=utf-8",
            $"transacoes_{export.Start:MM-yyyy}_{export.End:MM-yyyy}.csv");
    }

    /// <summary>Exporta os lançamentos do período em JSON.</summary>
    [ProducesResponseType<PeriodExportResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [HttpGet("export.json")]
    public async Task<ActionResult<PeriodExportResponse>> ExportJson(
        [FromQuery] DateTime? start, [FromQuery] DateTime? end) =>
        Ok(await reportService.GetExportAsync(CurrentUserId, start, end));
}
