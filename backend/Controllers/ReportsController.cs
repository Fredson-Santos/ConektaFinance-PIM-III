using Microsoft.AspNetCore.Mvc;
using PIM_III_Backend.Application.Dtos.Reports;
using PIM_III_Backend.Application.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace PIM_III_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _service;

    public ReportsController(IReportService service) => _service = service;

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

    [HttpGet("summary")]
    public async Task<ActionResult<ReportSummaryResponse>> GetSummary()
    {
        return Ok(await _service.GetSummaryAsync(GetCurrentUserId()));
    }

    [HttpGet("by-category")]
    public async Task<ActionResult<IEnumerable<CategoryReportResponse>>> GetByCategory()
    {
        return Ok(await _service.GetByCategoryAsync(GetCurrentUserId()));
    }

    [HttpGet("trend")]
    public async Task<ActionResult<IEnumerable<TrendReportResponse>>> GetTrend()
    {
        return Ok(await _service.GetTrendAsync(GetCurrentUserId()));
    }
}
