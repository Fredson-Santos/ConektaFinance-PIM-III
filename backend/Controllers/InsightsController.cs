using Microsoft.AspNetCore.Mvc;
using PIM_III_Backend.Application.Dtos.Insights;
using PIM_III_Backend.Application.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace PIM_III_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class InsightsController : ControllerBase
{
    private readonly IInsightService _service;

    public InsightsController(IInsightService service) => _service = service;

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
    public async Task<ActionResult<IEnumerable<InsightResponse>>> GetInsights()
    {
        return Ok(await _service.GetInsightsAsync(GetCurrentUserId()));
    }
}
