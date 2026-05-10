using Microsoft.AspNetCore.Mvc;
using PIM_III_Backend.Application.Dtos.Insights;
using PIM_III_Backend.Application.Dtos.Insights;
using PIM_III_Backend.Application.Services;

namespace PIM_III_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InsightsController : ControllerBase
{
    private readonly IInsightService _service;

    public InsightsController(IInsightService service) => _service = service;

    private int GetCurrentUserId() => 1;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<InsightResponse>>> GetInsights()
    {
        return Ok(await _service.GetInsightsAsync(GetCurrentUserId()));
    }
}
