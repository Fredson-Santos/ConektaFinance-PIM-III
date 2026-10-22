using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PIM_III_Backend.Application.Services;

namespace PIM_III_Backend.Infrastructure.Messaging;

/// <summary>
/// Cliente HTTP da Evolution API v2 (https://docs.evolutionfoundation.com.br),
/// responsavel por enviar mensagens e baixar midias do WhatsApp. Usado tanto
/// para entregar o OTP quanto para responder o agente financeiro.
/// </summary>
public class EvolutionClient(
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration,
    ILogger<EvolutionClient> logger) : IEvolutionClient
{
    // A Evolution espera propriedades camelCase (number, text, key...).
    private static readonly JsonSerializerOptions BodyJson = new(JsonSerializerDefaults.Web);

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(configuration["Evolution:BaseUrl"]) &&
        !string.IsNullOrWhiteSpace(configuration["Evolution:ApiKey"]) &&
        !string.IsNullOrWhiteSpace(configuration["Evolution:Instance"]);

    public async Task SendTextAsync(string phone, string text, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
        {
            logger.LogWarning("Evolution API nao configurada: mensagem para {Phone} nao foi entregue", phone);
            return;
        }

        var payload = JsonSerializer.Serialize(new
        {
            number = WhatsAppNumbers.ToEvolution(phone),
            text,
            delay = configuration.GetValue("Evolution:SendDelayMs", 800)
        }, BodyJson);
        await PostAsync("message/sendText/" + configuration["Evolution:Instance"], payload, cancellationToken);
        logger.LogInformation("Mensagem WhatsApp entregue para {Phone}", phone);
    }

    public async Task<string?> DownloadMediaBase64Async(string remoteJid, string messageId, bool fromMe,
        CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
            return null;

        var payload = JsonSerializer.Serialize(new
        {
            message = new { key = new { remoteJid, id = messageId, fromMe } },
            convertToMp4 = false
        }, BodyJson);
        var body = await PostAsync(
            "chat/getBase64FromMediaMessage/" + configuration["Evolution:Instance"], payload, cancellationToken);
        if (string.IsNullOrWhiteSpace(body))
            return null;

        using var document = JsonDocument.Parse(body);
        var root = document.RootElement;
        if (TryGetBase64(root, out var direct))
            return direct;
        if (root.TryGetProperty("data", out var data) && TryGetBase64(data, out var nested))
            return nested;
        logger.LogWarning("Resposta da Evolution sem base64 para a midia {MessageId}", messageId);
        return null;
    }

    private static bool TryGetBase64(JsonElement element, out string? base64)
    {
        base64 = null;
        if (element.ValueKind != JsonValueKind.Object)
            return false;
        if (!element.TryGetProperty("base64", out var value) || value.ValueKind != JsonValueKind.String)
            return false;
        base64 = value.GetString();
        return !string.IsNullOrWhiteSpace(base64);
    }

    private async Task<string?> PostAsync(string path, string json, CancellationToken cancellationToken)
    {
        var baseUrl = configuration["Evolution:BaseUrl"]!.TrimEnd('/');
        using var client = httpClientFactory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/{path}")
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };
        request.Headers.TryAddWithoutValidation("apikey", configuration["Evolution:ApiKey"]);

        using var response = await client.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogError("Evolution API respondeu {Status} em {Path}: {Body}",
                (int)response.StatusCode, path, body);
            throw new InvalidOperationException($"Evolution API respondeu {(int)response.StatusCode}.");
        }
        return body;
    }
}
