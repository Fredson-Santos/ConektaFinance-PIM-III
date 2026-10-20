using Microsoft.AspNetCore.Mvc;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Exceptions;
using PIM_III_Backend.Application.Services;

namespace PIM_III_Backend.Controllers;

public class BudgetsController(IBudgetService budgetService) : BaseApiController
{
    [HttpPut]
    public async Task<ActionResult<BudgetResponse>> Upsert(BudgetUpsertRequest request) =>
        Ok(await budgetService.UpsertAsync(CurrentUserId, request));

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
