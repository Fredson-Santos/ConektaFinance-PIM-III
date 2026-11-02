using Microsoft.AspNetCore.Mvc;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Exceptions;
using PIM_III_Backend.Application.Services;

namespace PIM_III_Backend.Controllers;

/// <summary>
/// Tetos de gastos por categoria e período.
/// </summary>
[Tags("Orçamentos")]
public class BudgetsController(IBudgetService budgetService) : BaseApiController
{
    /// <summary>Cria ou atualiza o teto de uma categoria no mês/ano (operação idempotente).</summary>
    [ProducesResponseType<BudgetResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [HttpPut]
    public async Task<ActionResult<BudgetResponse>> Upsert(BudgetUpsertRequest request) =>
        Ok(await budgetService.UpsertAsync(CurrentUserId, request));

    /// <summary>Lista os tetos do período com gasto, percentual e status (ok, warn, over).</summary>
    [ProducesResponseType<List<BudgetResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [HttpGet]
    public async Task<ActionResult<List<BudgetResponse>>> List([FromQuery] int? month, [FromQuery] int? year)
    {
        var now = DateTime.UtcNow;
        var effectiveMonth = month ?? now.Month;
        var effectiveYear = year ?? now.Year;
        if (effectiveMonth is < 1 or > 12)
            throw AppException.BadRequest("Mes invalido", "Informe um mes entre 1 e 12.");
        return Ok(await budgetService.ListAsync(CurrentUserId, effectiveMonth, effectiveYear));
    }
}
