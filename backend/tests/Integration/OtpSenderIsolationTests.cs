using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using PIM_III_Backend.Application.Services;
using PIM_III_Backend.Infrastructure.Messaging;
using Xunit;

namespace PIM_III_Backend.Tests.Integration;

/// <summary>
/// Regressao do incidente de envios indevidos pelo WhatsApp: a suíte roda em
/// ambiente Development e herda os user secrets da maquina do desenvolvedor —
/// incluindo credenciais reais da Evolution API quando configuradas. Sem a
/// troca do IOtpSender pelo DevOtpSender, os testes de OTP disparavam
/// mensagens REAIS de codigo de verificacao para os telefones dos casos de
/// teste, alcancando numeros de pessoas que nunca as solicitaram.
///
/// Este teste garante que o host de integracao resolva sempre o sender
/// simulado, mesmo com a Evolution API configurada.
/// </summary>
public class OtpSenderIsolationTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public void Host_de_teste_resolve_sender_simulado_de_otp_nunca_o_real()
    {
        using var scope = factory.Services.CreateScope();

        var sender = scope.ServiceProvider.GetRequiredService<IOtpSender>();

        sender.Should().BeOfType<DevOtpSender>(
            "a suíte de testes nunca deve enviar mensagens reais de WhatsApp");
    }
}
