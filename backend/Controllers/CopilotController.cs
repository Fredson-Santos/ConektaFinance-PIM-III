using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Services;

namespace PIM_III_Backend.Controllers;

[EnableRateLimiting("auth")]
public class CopilotController(ICopilotService copilotService) : BaseApiController
{
    [HttpGet("history")]
    public async Task<ActionResult<CopilotHistoryResponse>> History() =>
        Ok(await copilotService.GetHistoryAsync(CurrentUserId));

    [HttpPost("messages")]
    public async Task<ActionResult<CopilotExchangeResponse>> SendMessage(SendCopilotMessageRequest request) =>
        Ok(await copilotService.SendMessageAsync(CurrentUserId, request.Content));

    [HttpDelete("history")]
    public async Task<ActionResult> ClearHistory()
    {
        await copilotService.ClearHistoryAsync(CurrentUserId);
        return NoContent();
    }
}
