namespace PIM_III_Backend.Application.Services;

public interface IWhatsAppChannelService
{
    /// <summary>
    /// Processa o payload bruto do webhook da Evolution API. Eventos que nao
    /// sejam mensagens.upsert de usuarios validos sao ignorados em silencio.
    /// </summary>
    Task HandleEventAsync(string payload, CancellationToken cancellationToken = default);
}
