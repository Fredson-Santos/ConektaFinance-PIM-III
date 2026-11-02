using Microsoft.AspNetCore.Mvc;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Services;

namespace PIM_III_Backend.Controllers;

/// <summary>
/// Central de alertas de orçamento (80% e 100% do teto por categoria).
/// </summary>
[Tags("Alertas")]
public class AlertsController(IAlertService alertService) : BaseApiController
{
    /// <summary>Lista os alertas do usuário, opcionalmente apenas os não lidos.</summary>
    [ProducesResponseType<List<AlertResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [HttpGet]
    public async Task<ActionResult<List<AlertResponse>>> List([FromQuery] bool unreadOnly = false) =>
        Ok(await alertService.ListAsync(CurrentUserId, unreadOnly));

    /// <summary>Quantidade de alertas não lidos (badge do sino).</summary>
    [ProducesResponseType<UnreadCountResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [HttpGet("unread-count")]
    public async Task<ActionResult<UnreadCountResponse>> UnreadCount() =>
        Ok(new UnreadCountResponse(await alertService.CountUnreadAsync(CurrentUserId)));

    /// <summary>Marca um alerta como lido.</summary>
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [HttpPut("{id:int}/read")]
    public async Task<ActionResult> MarkAsRead(int id)
    {
        await alertService.MarkAsReadAsync(CurrentUserId, id);
        return NoContent();
    }

    /// <summary>Dispensa (remove) um alerta.</summary>
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Dismiss(int id)
    {
        await alertService.DismissAsync(CurrentUserId, id);
        return NoContent();
    }
}
