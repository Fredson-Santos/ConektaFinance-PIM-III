using Microsoft.AspNetCore.Mvc;
using PIM_III_Backend.Application.Dtos.Expenses;
using PIM_III_Backend.Application.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace PIM_III_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ExpensesController : ControllerBase
{
    private readonly IExpenseService _service;
    private readonly IAlertService _alertService;

    public ExpensesController(IExpenseService service, IAlertService alertService)
    {
        _service = service;
        _alertService = alertService;
    }

    private int GetCurrentUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ExpenseResponse>>> GetUserExpenses([FromQuery] DateTime? start, [FromQuery] DateTime? end, [FromQuery] int? categoryId)
    {
        return Ok(await _service.GetUserExpensesAsync(GetCurrentUserId(), start, end, categoryId));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ExpenseResponse>> GetById(int id)
    {
        var expense = await _service.GetByIdAsync(id, GetCurrentUserId());
        if (expense == null) return NotFound();
        return Ok(expense);
    }

    [HttpPost]
    public async Task<ActionResult<ExpenseResponse>> Create(CreateExpenseRequest request)
    {
        var expense = await _service.CreateAsync(GetCurrentUserId(), request);
        
        // Verificar alertas de orçamento de forma assíncrona (Fire and Forget ou aguardar conforme criticidade)
        _ = _alertService.CheckBudgetAlertsAsync(GetCurrentUserId(), request.CategoryId, request.Value);

        return CreatedAtAction(nameof(GetById), new { id = expense.Id }, expense);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateExpenseRequest request)
    {
        try
        {
            await _service.UpdateAsync(id, GetCurrentUserId(), request);
            return NoContent();
        }
        catch (Exception)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteAsync(id, GetCurrentUserId());
        return NoContent();
    }
}
