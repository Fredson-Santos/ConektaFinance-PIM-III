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
        Ok(await copilotService.GetHistoryAsync(CurrentUserId, Domain.Enums.ChatChannel.Web));

    [HttpPost("messages")]
    public async Task<ActionResult<CopilotExchangeResponse>> SendMessage(SendCopilotMessageRequest request) =>
        Ok(await copilotService.SendMessageAsync(CurrentUserId, request.Content, request.ImageBase64, Domain.Enums.ChatChannel.Web));

    [HttpPost("messages/{id:int}/confirm")]
    public async Task<ActionResult<CopilotMessageDto>> Confirm(int id) =>
        Ok(await copilotService.ConfirmDraftAsync(CurrentUserId, id));

    [HttpDelete("history")]
    public async Task<ActionResult> ClearHistory()
    {
        await copilotService.ClearHistoryAsync(CurrentUserId, Domain.Enums.ChatChannel.Web);
        return NoContent();
    }
}
