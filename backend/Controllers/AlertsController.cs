using Microsoft.AspNetCore.Mvc;
using PIM_III_Backend.Application.Dtos.Alerts;
using PIM_III_Backend.Application.Services;

namespace PIM_III_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AlertsController : ControllerBase
{
    private readonly IAlertService _service;

    public AlertsController(IAlertService service) => _service = service;

    private int GetCurrentUserId() => 1;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AlertResponse>>> GetAlerts([FromQuery] bool unreadOnly = false)
    {
        return Ok(await _service.GetUserAlertsAsync(GetCurrentUserId(), unreadOnly));
    }

    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        await _service.MarkAsReadAsync(id, GetCurrentUserId());
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteAsync(id, GetCurrentUserId());
        return NoContent();
    }
}
