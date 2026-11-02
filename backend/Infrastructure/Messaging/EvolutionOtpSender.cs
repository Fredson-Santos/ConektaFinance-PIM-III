using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PIM_III_Backend.Application.Services;

namespace PIM_III_Backend.Infrastructure.Messaging;

/// <summary>
/// Entrega real do codigo OTP pelo WhatsApp (Evolution API). Registrado apenas
/// quando a Evolution esta configurada; sem configuracao o DevOtpSender mantem
/// o comportamento de desenvolvimento (codigo no log).
/// </summary>
public class EvolutionOtpSender(
    IEvolutionClient evolutionClient,
    IConfiguration configuration,
    ILogger<EvolutionOtpSender> logger) : IOtpSender
{
    public async Task SendAsync(string phone, string code)
    {
        var minutes = configuration.GetValue("Otp:ExpirationMinutes", 5);
        logger.LogInformation("Enviando OTP por WhatsApp para {Phone}", phone);
        await evolutionClient.SendTextAsync(phone,
            $"ConektaFinance\n\nSeu codigo de acesso e {code}. Ele expira em {minutes} minutos.\n\n" +
            "Se voce nao pediu este codigo, ignore esta mensagem.");
    }
}
