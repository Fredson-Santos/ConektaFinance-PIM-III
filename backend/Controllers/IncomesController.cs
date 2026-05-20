using Microsoft.AspNetCore.Mvc;
using PIM_III_Backend.Application.Dtos.Incomes;
using PIM_III_Backend.Application.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace PIM_III_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class IncomesController : ControllerBase
{
    private readonly IIncomeService _service;

    public IncomesController(IIncomeService service)
    {
        _service = service;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) 
            ?? User.FindFirstValue("sub") 
            ?? User.FindFirstValue("user_id");
        
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Não foi possível extrair o identificador do usuário do token JWT.");
        }
        
        return userId;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<IncomeResponse>>> GetUserIncomes([FromQuery] DateTime? start, [FromQuery] DateTime? end)
    {
        return Ok(await _service.GetUserIncomesAsync(GetCurrentUserId(), start, end));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<IncomeResponse>> GetById(int id)
    {
        var income = await _service.GetByIdAsync(id, GetCurrentUserId());
        if (income == null) return NotFound();
        return Ok(income);
    }

    [HttpPost]
    public async Task<ActionResult<IncomeResponse>> Create(CreateIncomeRequest request)
    {
        var income = await _service.CreateAsync(GetCurrentUserId(), request);
        return CreatedAtAction(nameof(GetById), new { id = income.Id }, income);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteAsync(id, GetCurrentUserId());
        return NoContent();
    }
}
