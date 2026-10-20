using Microsoft.AspNetCore.Mvc;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Services;

namespace PIM_III_Backend.Controllers;

public class AlertsController(IAlertService alertService) : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<List<AlertResponse>>> List([FromQuery] bool unreadOnly = false) =>
        Ok(await alertService.ListAsync(CurrentUserId, unreadOnly));

    [HttpGet("unread-count")]
    public async Task<ActionResult<UnreadCountResponse>> UnreadCount() =>
        Ok(new UnreadCountResponse(await alertService.CountUnreadAsync(CurrentUserId)));

    [HttpPut("{id:int}/read")]
    public async Task<ActionResult> MarkAsRead(int id)
    {
        await alertService.MarkAsReadAsync(CurrentUserId, id);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Dismiss(int id)
    {
        await alertService.DismissAsync(CurrentUserId, id);
        return NoContent();
    }
}
