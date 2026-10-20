using Microsoft.AspNetCore.Mvc;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Exceptions;
using PIM_III_Backend.Application.Services;
using PIM_III_Backend.Domain.Enums;

namespace PIM_III_Backend.Controllers;

public class ReportsController(IReportService reportService) : BaseApiController
{
    [HttpGet("summary")]
    public async Task<ActionResult<ReportSummaryResponse>> Summary(
        [FromQuery] DateTime? start, [FromQuery] DateTime? end) =>
        Ok(await reportService.GetSummaryAsync(CurrentUserId, start, end));

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

    [HttpGet("trend")]
    public async Task<ActionResult<List<TrendReportResponse>>> Trend([FromQuery] int months = 6) =>
        Ok(await reportService.GetTrendAsync(CurrentUserId, months));

    [HttpGet("daily")]
    public async Task<ActionResult<List<DailyExpenseReportResponse>>> Daily(
        [FromQuery] DateTime? start, [FromQuery] DateTime? end) =>
        Ok(await reportService.GetDailyAsync(CurrentUserId, start, end));

    [HttpGet("export.csv")]
    public async Task<IActionResult> ExportCsv([FromQuery] DateTime? start, [FromQuery] DateTime? end)
    {
        var export = await reportService.GetExportAsync(CurrentUserId, start, end);
        var csv = PIM_III_Backend.Application.Services.ReportService.BuildCsv(export);
        var bytes = System.Text.Encoding.UTF8.GetPreamble().Concat(System.Text.Encoding.UTF8.GetBytes(csv)).ToArray();
        return File(bytes, "text/csv; charset=utf-8",
            $"transacoes_{export.Start:MM-yyyy}_{export.End:MM-yyyy}.csv");
    }

    [HttpGet("export.json")]
    public async Task<ActionResult<PeriodExportResponse>> ExportJson(
        [FromQuery] DateTime? start, [FromQuery] DateTime? end) =>
        Ok(await reportService.GetExportAsync(CurrentUserId, start, end));
}
