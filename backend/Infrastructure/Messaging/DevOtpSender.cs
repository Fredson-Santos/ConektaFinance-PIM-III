using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PIM_III_Backend.Application.Services;

namespace PIM_III_Backend.Infrastructure.Messaging;

public class DevOtpSender(ILogger<DevOtpSender> logger, IConfiguration configuration) : IOtpSender
{
    public Task SendAsync(string phone, string code)
    {
        if (configuration.GetValue("Otp:DevMode", false))
            logger.LogInformation("Simulacao WhatsApp: codigo OTP {Code} enviado para {Phone}", code, phone);
        else
            logger.LogWarning("Provedor WhatsApp nao configurado: o codigo OTP para {Phone} nao foi entregue", phone);
        return Task.CompletedTask;
    }
}
