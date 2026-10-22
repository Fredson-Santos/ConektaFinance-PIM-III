using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Exceptions;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Application.Services;

/// <summary>
/// Ponte entre o webhook da Evolution API e o mesmo CopilotService usado pelo
/// painel web: texto e foto de nota viram mensagens do agente; "confirmar" e
/// "cancelar" resolvem o rascunho pendente mais recente do usuario.
///
/// Regras de silencio (anti-ban e anti-loop): mensagens do proprio numero,
/// grupos, broadcast, newsletters, numeros nao vinculados, eventos repetidos
/// e mensagens antigas sao ignoradas sem qualquer resposta.
/// </summary>
public class WhatsAppChannelService(
    IUserRepository userRepository,
    ICopilotService copilotService,
    IChatMessageRepository chatRepository,
    IEvolutionClient evolutionClient,
    IMemoryCache cache,
    ILogger<WhatsAppChannelService> logger) : IWhatsAppChannelService
{
    private const int MaxMessageAgeHours = 24;
    private static readonly TimeSpan DedupeWindow = TimeSpan.FromHours(24);

    private static readonly string[] ConfirmCommands = ["confirmar", "confirma", "confirm", "1", "✅"];
    private static readonly string[] CancelCommands = ["cancelar", "cancela", "cancel", "2", "❌"];

    private static readonly string[] KnownMessageTypes =
    [
        "conversation", "extendedTextMessage", "imageMessage", "audioMessage",
        "videoMessage", "documentMessage", "stickerMessage", "reactionMessage",
        "contactMessage", "locationMessage", "viewOnceMessage", "buttonsResponseMessage", "listResponseMessage"
    ];

    public async Task HandleEventAsync(string payload, CancellationToken cancellationToken = default)
    {
        JsonDocument? document;
        try
        {
            document = JsonDocument.Parse(payload);
        }
        catch (JsonException)
        {
            logger.LogWarning("Webhook WhatsApp com JSON invalido ignorado");
            return;
        }

        using (document)
        {
            var root = document.RootElement;
            if (root.ValueKind != JsonValueKind.Object || !IsMessagesUpsert(root))
                return;
            if (!root.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Object)
                return;
            if (!data.TryGetProperty("key", out var key) || key.ValueKind != JsonValueKind.Object)
                return;

            var remoteJid = GetString(key, "remoteJid");
            if (string.IsNullOrWhiteSpace(remoteJid) ||
                !remoteJid.EndsWith("@s.whatsapp.net", StringComparison.OrdinalIgnoreCase))
                return; // grupos (@g.us), broadcast, newsletter e outros tipos de chat

            if (key.TryGetProperty("fromMe", out var fromMe) && fromMe.ValueKind == JsonValueKind.True)
                return;

            var messageId = GetString(key, "id");
            if (string.IsNullOrWhiteSpace(messageId))
                return;

            if (cache.TryGetValue(CacheKey(messageId), out _))
                return; // reentrega do mesmo evento pela Evolution
            cache.Set(CacheKey(messageId), true, DedupeWindow);

            if (IsStale(data))
            {
                logger.LogInformation("Mensagem WhatsApp antiga ignorada (id {MessageId})", messageId);
                return;
            }

            var phone = WhatsAppNumbers.TryNormalizeFromJid(remoteJid);
            if (phone is null)
                return;

            User? user = null;
            foreach (var candidate in WhatsAppNumbers.GetLookupCandidates(phone))
            {
                user = await userRepository.GetByPhoneAsync(candidate);
                if (user is not null)
                    break;
            }

            if (user is null)
            {
                // Silencio absoluto para numeros nao vinculados: reduz risco de
                // ban (ToS da Meta) e evita loops com outros bots.
                logger.LogInformation("Mensagem WhatsApp de numero nao vinculado ignorada ({Phone})",
                    WhatsAppNumbers.MaskPhone(phone));
                return;
            }

            if (!evolutionClient.IsConfigured)
            {
                logger.LogWarning("Evolution API nao configurada: mensagem de {Phone} descartada",
                    WhatsAppNumbers.MaskPhone(phone));
                return;
            }

            try
            {
                await DispatchAsync(user.Id, phone, remoteJid, messageId, data, cancellationToken);
            }
            catch (AppException exception)
            {
                logger.LogInformation("WhatsApp de {Phone} recebeu erro de negocio: {Detail}",
                    WhatsAppNumbers.MaskPhone(phone), exception.Detail);
                await ReplyAsync(phone, exception.Detail, cancellationToken);
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Falha ao processar mensagem WhatsApp de {Phone}",
                    WhatsAppNumbers.MaskPhone(phone));
                await ReplyAsync(phone, "Tive um problema tecnico agora. Tente novamente em instantes.",
                    cancellationToken);
            }
        }
    }

    private async Task DispatchAsync(int userId, string phone, string remoteJid, string messageId,
        JsonElement data, CancellationToken cancellationToken)
    {
        var message = data.TryGetProperty("message", out var raw) && raw.ValueKind == JsonValueKind.Object
            ? raw
            : default;
        if (message.ValueKind != JsonValueKind.Object)
            return;

        var messageType = GetString(data, "messageType") ?? InferMessageType(message);
        var text = ExtractText(message, messageType);
        var (isImage, caption) = IsImageWithCaption(message, messageType);

        if (isImage)
        {
            await HandleImageAsync(userId, phone, remoteJid, messageId, caption, cancellationToken);
            return;
        }

        if (messageType is "audioMessage" or "videoMessage" or "documentMessage")
        {
            await ReplyAsync(phone,
                "Ainda nao consigo ler esse tipo de arquivo por aqui. Me mande um texto ou uma foto de nota/cupom.",
                cancellationToken);
            return;
        }

        if (string.IsNullOrWhiteSpace(text))
            return; // reacoes, adesivos, presenca e protocolos ficam em silencio

        var command = MatchCommand(text);
        if (command is not null)
        {
            await HandleCommandAsync(userId, phone, command.Value, cancellationToken);
            return;
        }

        var exchange = await copilotService.SendMessageAsync(userId, text);
        await ReplyWithAgentAsync(phone, exchange.AssistantMessage, cancellationToken);
    }

    private async Task HandleImageAsync(int userId, string phone, string remoteJid, string messageId,
        string? caption, CancellationToken cancellationToken)
    {
        logger.LogInformation("Iniciando processamento de imagem enviada por {Phone} (messageId: {MessageId})",
            WhatsAppNumbers.MaskPhone(phone), messageId);

        using var downloadCts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
        var mediaBase64 = await evolutionClient.DownloadMediaBase64Async(remoteJid, messageId, fromMe: false,
            downloadCts.Token);
        if (string.IsNullOrWhiteSpace(mediaBase64))
        {
            logger.LogWarning("Nao foi possivel baixar midia da mensagem {MessageId} de {Phone}",
                messageId, WhatsAppNumbers.MaskPhone(phone));
            await ReplyAsync(phone, "Nao consegui baixar a imagem. Tente enviar novamente.", cancellationToken);
            return;
        }

        // A Evolution pode devolver data URI; o fluxo do copilot aceita base64 puro.
        var comma = mediaBase64.IndexOf(',');
        if (mediaBase64.StartsWith("data:", StringComparison.OrdinalIgnoreCase) && comma >= 0)
            mediaBase64 = mediaBase64[(comma + 1)..];

        var exchange = await copilotService.SendMessageAsync(userId, caption ?? string.Empty, mediaBase64);
        await ReplyWithAgentAsync(phone, exchange.AssistantMessage, cancellationToken);
        logger.LogInformation("Confirmacao da imagem {MessageId} entregue para {Phone}",
            messageId, WhatsAppNumbers.MaskPhone(phone));
    }

    private async Task HandleCommandAsync(int userId, string phone, bool confirm, CancellationToken cancellationToken)
    {
        var draft = await FindPendingDraftAsync(userId);
        if (draft is null)
        {
            await ReplyAsync(phone,
                "Nao encontrei nenhum lancamento aguardando confirmacao. Me diga o que deseja registrar que eu cuido do resto.",
                cancellationToken);
            return;
        }

        var result = confirm
            ? await copilotService.ConfirmDraftAsync(userId, draft.Id)
            : await copilotService.CancelDraftAsync(userId, draft.Id);
        await ReplyAsync(phone, result.Content, cancellationToken);
    }

    private async Task<ChatMessage?> FindPendingDraftAsync(int userId)
    {
        var recent = await chatRepository.ListRecentWithActionsAsync(userId);
        return recent.FirstOrDefault(message =>
            CopilotService.ParseActions(message.ActionPayload)?.Any(CopilotService.IsPendingDraftAction) == true);
    }

    private async Task ReplyWithAgentAsync(string phone, CopilotMessageDto assistant,
        CancellationToken cancellationToken)
    {
        var reply = assistant.Content;
        if (string.IsNullOrWhiteSpace(reply))
            reply = "Recebi sua solicitacao e os dados foram processados com sucesso.";

        if (assistant.Actions?.Any(CopilotService.IsPendingDraftAction) == true)
            reply += "\n\nResponda *confirmar* para lancar ou *cancelar* para descartar.";
        await ReplyAsync(phone, AdaptToWhatsApp(reply), cancellationToken);
    }

    private async Task ReplyAsync(string phone, string text, CancellationToken cancellationToken)
    {
        try
        {
            // Usamos timeout dedicado e independente do ciclo de vida da requisicao HTTP
            // de entrada do webhook, garantindo a entrega ao remetente mesmo apos timeout da conexao do webhook.
            using var replyCts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
            await evolutionClient.SendTextAsync(phone, text, replyCts.Token);
            logger.LogInformation("Mensagem entregue com sucesso para o WhatsApp de {Phone}",
                WhatsAppNumbers.MaskPhone(phone));
        }
        catch (OperationCanceledException ex)
        {
            logger.LogError(ex, "Timeout de 30s ao enviar resposta WhatsApp para {Phone}",
                WhatsAppNumbers.MaskPhone(phone));
        }
        catch (Exception exception)
        {
            // A resposta do agente ja foi persistida no historico; apenas logamos
            // a falha de entrega para nao propagar erro ao webhook.
            logger.LogError(exception, "Falha ao enviar resposta WhatsApp para {Phone}: {Message}",
                WhatsAppNumbers.MaskPhone(phone), exception.Message);
        }
    }

    /// <summary>Interpreta o comando de confirmacao/cancelamento; null quando nao e comando.</summary>
    internal static bool? MatchCommand(string text)
    {
        var normalized = text.Trim().ToLowerInvariant().TrimEnd('.', '!', '?', ':', ';', ' ');
        if (ConfirmCommands.Contains(normalized))
            return true;
        if (CancelCommands.Contains(normalized))
            return false;
        return null;
    }

    /// <summary>Converte o markdown das respostas do agente para o formato do WhatsApp.</summary>
    internal static string AdaptToWhatsApp(string markdown)
    {
        var text = Regex.Replace(markdown, @"\*\*(.+?)\*\*", "*$1*"); // **negrito** -> *negrito*
        text = Regex.Replace(text, @"^#{1,6}\s*", string.Empty, RegexOptions.Multiline); // titulos
        text = Regex.Replace(text, @"^[-*]\s+", "• ", RegexOptions.Multiline); // bullets
        text = Regex.Replace(text, @"\[(.+?)\]\([^)]*\)", "$1"); // [texto](url) -> texto
        return text;
    }

    private static bool IsMessagesUpsert(JsonElement root)
    {
        if (!root.TryGetProperty("event", out var eventElement) || eventElement.ValueKind != JsonValueKind.String)
            return false;
        // Payloads variam entre "messages.upsert" e "MESSAGES_UPSERT" conforme a versao.
        var name = eventElement.GetString()!.Replace(".", string.Empty).Replace("_", string.Empty)
            .ToLowerInvariant();
        return name == "messagesupsert";
    }

    private static bool IsStale(JsonElement data)
    {
        if (!data.TryGetProperty("messageTimestamp", out var timestamp) ||
            timestamp.ValueKind != JsonValueKind.Number ||
            !timestamp.TryGetInt64(out var seconds))
            return false;
        var age = DateTimeOffset.UtcNow - DateTimeOffset.FromUnixTimeSeconds(seconds);
        return age.TotalHours > MaxMessageAgeHours;
    }

    private static string? InferMessageType(JsonElement message) =>
        KnownMessageTypes.FirstOrDefault(type => message.TryGetProperty(type, out _));

    private static string? ExtractText(JsonElement message, string? messageType)
    {
        if (messageType == "conversation" &&
            message.TryGetProperty("conversation", out var conversation) &&
            conversation.ValueKind == JsonValueKind.String)
            return conversation.GetString();
        if (messageType == "extendedTextMessage" &&
            message.TryGetProperty("extendedTextMessage", out var extended) &&
            extended.ValueKind == JsonValueKind.Object &&
            extended.TryGetProperty("text", out var text) &&
            text.ValueKind == JsonValueKind.String)
            return text.GetString();
        return null;
    }

    private static (bool IsImage, string? Caption) IsImageWithCaption(JsonElement message, string? messageType)
    {
        if (messageType != "imageMessage" ||
            !message.TryGetProperty("imageMessage", out var image) ||
            image.ValueKind != JsonValueKind.Object)
            return (false, null);
        var caption = image.TryGetProperty("caption", out var captionElement) &&
                      captionElement.ValueKind == JsonValueKind.String
            ? captionElement.GetString()
            : null;
        return (true, caption);
    }

    private static string? GetString(JsonElement element, string property) =>
        element.TryGetProperty(property, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;

    private static string CacheKey(string messageId) => $"whatsapp:msg:{messageId}";
}
