using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using PIM_III_Backend.Application.Dtos.Chat;
using PIM_III_Backend.Application.Services;
using System.Security.Claims;

namespace PIM_III_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ChatController : ControllerBase
{
    private readonly IChatService _service;

    public ChatController(IChatService service)
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
    public async Task<ActionResult<IEnumerable<ChatMessageDto>>> GetHistory()
    {
        var history = await _service.GetHistoryAsync(GetCurrentUserId());
        return Ok(history);
    }

    [HttpPost]
    public async Task<ActionResult<ChatMessageDto>> SendMessage([FromBody] SendChatMessageRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
            return BadRequest(new { message = "Mensagem não pode estar vazia." });

        var response = await _service.SendMessageAsync(GetCurrentUserId(), request.Content);
        return Ok(response);
    }

    [HttpDelete]
    public async Task<IActionResult> ClearHistory()
    {
        await _service.ClearHistoryAsync(GetCurrentUserId());
        return NoContent();
    }
}
