namespace PIM_III_Backend.Application.Services;

/// <summary>
/// Cliente da Evolution API (canal WhatsApp). A implementacao HTTP fica em
/// Infrastructure.Messaging; os testes usam fakes que capturam os envios.
/// </summary>
public interface IEvolutionClient
{
    /// <summary>Indica se Evolution:BaseUrl/ApiKey/Instance estao configurados.</summary>
    bool IsConfigured { get; }

    /// <summary>Envia um texto para o telefone no formato do dominio (10-11 digitos).</summary>
    Task SendTextAsync(string phone, string text, CancellationToken cancellationToken = default);

    /// <summary>
    /// Baixa a midia de uma mensagem recebida como base64 (sem prefixo data:).
    /// Retorna null quando a midia nao estiver disponivel.
    /// </summary>
    Task<string?> DownloadMediaBase64Async(string remoteJid, string messageId, bool fromMe,
        CancellationToken cancellationToken = default);
}
