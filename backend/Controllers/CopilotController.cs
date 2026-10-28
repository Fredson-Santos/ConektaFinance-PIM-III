using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Services;

namespace PIM_III_Backend.Controllers;

/// <summary>
/// Assistente financeiro com function calling (consultas e rascunhos de lançamento).
/// </summary>
[Tags("Assistente de IA")]
[EnableRateLimiting("auth")]
public class CopilotController(ICopilotService copilotService) : BaseApiController
{
    /// <summary>Histórico de conversa do canal web.</summary>
    [ProducesResponseType<CopilotHistoryResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    [HttpGet("history")]
    public async Task<ActionResult<CopilotHistoryResponse>> History() =>
        Ok(await copilotService.GetHistoryAsync(CurrentUserId, Domain.Enums.ChatChannel.Web));

    /// <summary>Envia uma mensagem (texto ou imagem de nota fiscal) e recebe a resposta do assistente.</summary>
    [ProducesResponseType<CopilotExchangeResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    [HttpPost("messages")]
    public async Task<ActionResult<CopilotExchangeResponse>> SendMessage(SendCopilotMessageRequest request) =>
        Ok(await copilotService.SendMessageAsync(CurrentUserId, request.Content, request.ImageBase64, Domain.Enums.ChatChannel.Web));

    /// <summary>Confirma o rascunho de lançamento sugerido pelo assistente e grava a transação.</summary>
    [ProducesResponseType<CopilotMessageDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    [HttpPost("messages/{id:int}/confirm")]
    public async Task<ActionResult<CopilotMessageDto>> Confirm(int id) =>
        Ok(await copilotService.ConfirmDraftAsync(CurrentUserId, id));

    /// <summary>Apaga o histórico de conversa do canal web.</summary>
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    [HttpDelete("history")]
    public async Task<ActionResult> ClearHistory()
    {
        await copilotService.ClearHistoryAsync(CurrentUserId, Domain.Enums.ChatChannel.Web);
        return NoContent();
    }
}
