using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Configuration;
using PIM_III_Backend.Application.Services;

namespace PIM_III_Backend.Controllers;

/// <summary>
/// Endpoints publicos de webhook para integracoes externas. O canal WhatsApp
/// (Evolution API) autentica com a chave configurada em Evolution:WebhookToken;
/// sem a chave o endpoint e recusado antes de qualquer processamento.
/// </summary>
[ApiController]
[Route("api/v1/webhooks")]
public class WebhooksController(
    IWhatsAppChannelService channel,
    IConfiguration configuration) : ControllerBase
{
    [HttpPost("whatsapp")]
    [AllowAnonymous]
    [EnableRateLimiting("webhook")]
    public async Task<IActionResult> WhatsApp(CancellationToken cancellationToken)
    {
        var expected = configuration["Evolution:WebhookToken"];
        if (!string.IsNullOrWhiteSpace(expected))
        {
            var provided = Request.Headers["apikey"].FirstOrDefault()
                ?? Request.Headers["x-api-key"].FirstOrDefault()
                ?? Request.Query["apikey"].FirstOrDefault();
            if (!string.Equals(provided, expected, StringComparison.Ordinal))
                return Unauthorized();
        }

        using var reader = new StreamReader(Request.Body);
        var payload = await reader.ReadToEndAsync(cancellationToken);

        // Sempre 200 (exceto token invalido): eventos ignorados nao devem gerar
        // reentregas em rajada da Evolution.
        await channel.HandleEventAsync(payload, cancellationToken);
        return Ok(new { status = "ok" });
    }
}
