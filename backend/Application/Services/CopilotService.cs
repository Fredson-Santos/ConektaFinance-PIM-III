using System.Text.Json;
using Microsoft.Extensions.Configuration;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Exceptions;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Application.Services;

public class CopilotService(
    IChatMessageRepository chatRepository,
    ICopilotToolProvider toolProvider,
    ICopilotAiClient aiClient,
    ICopilotImageStorage imageStorage,
    IConfiguration configuration) : ICopilotService
{
    private const int MaxImageBytes = 5 * 1024 * 1024;

    public async Task<CopilotHistoryResponse> GetHistoryAsync(int userId, ChatChannel channel = ChatChannel.Web)
    {
        var messages = await chatRepository.ListRecentAsync(userId, 50, channel);
        return new CopilotHistoryResponse(messages.OrderBy(m => m.Id).Select(Map).ToList());
    }

    public async Task<CopilotExchangeResponse> SendMessageAsync(int userId, string content, string? imageBase64 = null, ChatChannel channel = ChatChannel.Web)
    {
        var trimmed = content?.Trim() ?? string.Empty;
        var image = ParseImage(imageBase64);
        if (string.IsNullOrWhiteSpace(trimmed) && image is null)
            throw AppException.BadRequest("Mensagem vazia", "Escreva uma mensagem ou anexe uma imagem para o assistente.");

        var limit = configuration.GetValue("Copilot:DailyMessageLimit", 30);
        var sentToday = await chatRepository.CountSinceAsync(userId, ChatRole.User, DateTime.UtcNow.Date, channel);
        if (sentToday >= limit)
            throw AppException.TooManyRequests("Limite diario atingido",
                "Voce atingiu o limite de mensagens do assistente por hoje. Volte amanha.");

        var window = configuration.GetValue("Copilot:HistoryWindowSize", 12);
        var recent = await chatRepository.ListRecentAsync(userId, window * 2 + 2, channel);
        var history = recent
            .OrderBy(m => m.Id)
            .Select(m => new CopilotChatTurn(
                m.Role == ChatRole.User ? "user" : "assistant",
                m.Content))
            .TakeLast(window)
            .ToList();

        ReceiptExtract? receipt = null;
        if (image is not null)
            receipt = await aiClient.ExtractReceiptAsync(image.Base64);

        var now = DateTime.UtcNow;
        var userMessage = new ChatMessage
        {
            UserId = userId,
            Role = ChatRole.User,
            Channel = channel,
            Content = trimmed,
            ImageUrl = image is not null ? await imageStorage.SaveAsync(userId, image.Extension, image.Stream) : null
        };
        await chatRepository.AddAsync(userMessage);

        var context = await toolProvider.BuildContextAsync(userId, now.Month, now.Year);
        var request = new CopilotAgentRequest(
            userId,
            trimmed,
            image is not null,
            receipt,
            history,
            context);

        var reply = await aiClient.ReplyAsync(request);
        reply = GuardPromptLeak(reply);
        var assistantMessage = new ChatMessage
        {
            UserId = userId,
            Role = ChatRole.Assistant,
            Channel = channel,
            Content = reply.Content,
            ActionPayload = reply.Actions.Count > 0
                ? JsonSerializer.Serialize(reply.Actions.Select(a => new CopilotActionDto(a.Tool, a.Args, "pending")))
                : null
        };
        await chatRepository.AddAsync(assistantMessage);

        return new CopilotExchangeResponse(Map(userMessage), Map(assistantMessage));
    }

    public async Task<CopilotMessageDto> ConfirmDraftAsync(int userId, int messageId)
    {
        var message = await chatRepository.GetByIdAndUserAsync(messageId, userId)
            ?? throw AppException.NotFound("Mensagem nao encontrada", "O rascunho que voce tentou confirmar nao existe mais.");

        if (message.Role != ChatRole.Assistant)
            throw AppException.Conflict("Mensagem invalida", "Apenas respostas do assistente podem ser confirmadas.");

        var actions = ParseActions(message.ActionPayload);
        var draft = actions?.FirstOrDefault(IsPendingDraftAction);

        if (draft?.Args is null)
            throw AppException.Conflict("Rascunho indisponivel",
                "Nao ha rascunho pendente nesta mensagem (talvez ja tenha sido confirmado ou cancelado).");

        var resultJson = await toolProvider.ExecuteAsync(userId, "create_transaction",
            JsonSerializer.SerializeToElement(draft.Args));
        using var result = JsonDocument.Parse(resultJson);
        var root = result.RootElement;
        if (!root.TryGetProperty("success", out var success) || success.ValueKind != JsonValueKind.True)
        {
            var detail = root.TryGetProperty("error", out var error) && error.ValueKind == JsonValueKind.String
                ? error.GetString()
                : "Nao foi possivel registrar o lancamento.";
            throw AppException.Conflict("Rascunho invalido", detail!);
        }

        var transactionId = root.TryGetProperty("transactionId", out var id) && id.ValueKind == JsonValueKind.Number
            ? id.GetInt32()
            : (int?)null;

        MarkConsumed(actions!, draft, transactionId);
        message.ActionPayload = JsonSerializer.Serialize(actions!);
        await chatRepository.UpdateAsync(message);

        var description = root.TryGetProperty("description", out var descriptionElement) && descriptionElement.ValueKind == JsonValueKind.String
            ? descriptionElement.GetString()
            : "lancamento";
        var value = root.TryGetProperty("value", out var valueElement) && valueElement.ValueKind == JsonValueKind.Number
            ? valueElement.GetDecimal()
            : (decimal?)null;
        var category = root.TryGetProperty("category", out var categoryElement) && categoryElement.ValueKind == JsonValueKind.String
            ? categoryElement.GetString()
            : null;

        var confirmation = new ChatMessage
        {
            UserId = userId,
            Role = ChatRole.Assistant,
            Channel = message.Channel,
            Content = $"Lancamento registrado com sucesso: {description}" +
                      (value is not null ? $" de R$ {value:F2}" : string.Empty) +
                      (category is not null ? $" em {category}" : string.Empty) +
                      ". Ele ja aparece no seu historico e no dashboard."
        };
        await chatRepository.AddAsync(confirmation);

        return Map(confirmation);
    }

    public async Task<CopilotMessageDto> CancelDraftAsync(int userId, int messageId)
    {
        var message = await chatRepository.GetByIdAndUserAsync(messageId, userId)
            ?? throw AppException.NotFound("Mensagem nao encontrada", "O rascunho que voce tentou cancelar nao existe mais.");

        if (message.Role != ChatRole.Assistant)
            throw AppException.Conflict("Mensagem invalida", "Apenas respostas do assistente podem ser canceladas.");

        var actions = ParseActions(message.ActionPayload);
        var draft = actions?.FirstOrDefault(IsPendingDraftAction);
        if (draft?.Args is null)
            throw AppException.Conflict("Rascunho indisponivel",
                "Nao ha rascunho pendente nesta mensagem (talvez ja tenha sido confirmado ou cancelado).");

        var index = actions!.IndexOf(draft);
        actions[index] = draft with { Status = "cancelled" };
        message.ActionPayload = JsonSerializer.Serialize(actions);
        await chatRepository.UpdateAsync(message);

        var cancellation = new ChatMessage
        {
            UserId = userId,
            Role = ChatRole.Assistant,
            Channel = message.Channel,
            Content = "Lancamento cancelado. Nada foi gravado. Se quiser, envie os dados novamente."
        };
        await chatRepository.AddAsync(cancellation);

        return Map(cancellation);
    }

    public Task ClearHistoryAsync(int userId, ChatChannel channel = ChatChannel.Web) =>
        chatRepository.ClearAsync(userId, channel);

    internal static CopilotMessageDto Map(ChatMessage message) => new(
        message.Id,
        message.Role == ChatRole.User ? "user" : "assistant",
        message.Content,
        ParseActions(message.ActionPayload),
        message.ImageUrl,
        message.CreatedAt);

    internal static List<CopilotActionDto>? ParseActions(string? payload) =>
        string.IsNullOrWhiteSpace(payload)
            ? null
            : JsonSerializer.Deserialize<List<CopilotActionDto>>(payload);

    /// <summary>Acao de rascunho ainda aguardando confirmacao ou cancelamento do usuario.</summary>
    internal static bool IsPendingDraftAction(CopilotActionDto action) =>
        string.Equals(action.Tool, "draft_transaction", StringComparison.OrdinalIgnoreCase) &&
        !string.Equals(action.Status, "consumed", StringComparison.OrdinalIgnoreCase) &&
        !string.Equals(action.Status, "cancelled", StringComparison.OrdinalIgnoreCase);

    private static readonly string[] PromptLeakMarkers =
    [
        "Voce e o agente financeiro do ConektaFinance",
        "REGRAS DE ACAO",
        "PROIBICOES:",
        "FORMATO DA RESPOSTA FINAL",
        "sistema anexa automaticamente o rascunho"
    ];

    /// <summary>
    /// Guarda-corpo contra vazamento do prompt do sistema: se a resposta do LLM
    /// reproduzir trechos literais das instrucoes internas, ela e substituida por
    /// uma recusa antes de ser persistida ou exibida.
    /// </summary>
    internal static CopilotReply GuardPromptLeak(CopilotReply reply)
    {
        var leaked = PromptLeakMarkers.Any(marker =>
            reply.Content.Contains(marker, StringComparison.OrdinalIgnoreCase));

        if (!leaked)
            return reply;

        return new CopilotReply(
            "Prefiro nao compartilhar minhas instrucoes internas. Posso te ajudar com suas financas: resumo do mes, onde economizar ou registrar um lancamento.",
            []);
    }

    private static void MarkConsumed(List<CopilotActionDto> actions, CopilotActionDto draft, int? transactionId)
    {
        var index = actions.IndexOf(draft);
        var args = draft.Args is not null
            ? new Dictionary<string, object?>(draft.Args, StringComparer.OrdinalIgnoreCase)
            : [];
        if (transactionId is not null)
            args["transactionId"] = transactionId;
        actions[index] = draft with { Status = "consumed", Args = args };
    }

    private static ReceiptImage? ParseImage(string? imageBase64)
    {
        if (string.IsNullOrWhiteSpace(imageBase64))
            return null;

        var comma = imageBase64.IndexOf(',');
        var header = comma >= 0 ? imageBase64[..comma] : string.Empty;
        var payload = comma >= 0 ? imageBase64[(comma + 1)..] : imageBase64;

        var extension = ".jpg";
        if (header.Contains("image/png", StringComparison.OrdinalIgnoreCase))
            extension = ".png";
        else if (header.Contains("image/webp", StringComparison.OrdinalIgnoreCase))
            extension = ".webp";
        else if (header.Contains("image/jpeg", StringComparison.OrdinalIgnoreCase))
            extension = ".jpg";
        else if (header.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
            throw AppException.BadRequest("Imagem invalida", "Formatos aceitos: JPEG, PNG ou WebP.");

        byte[] bytes;
        try
        {
            bytes = Convert.FromBase64String(payload);
        }
        catch (FormatException)
        {
            throw AppException.BadRequest("Imagem invalida", "O conteudo enviado nao e uma imagem valida.");
        }

        if (bytes.Length == 0 || bytes.Length > MaxImageBytes)
            throw AppException.BadRequest("Imagem invalida", "A imagem deve ter entre 1 byte e 5 MB.");

        return new ReceiptImage(extension, payload, bytes);
    }

    private record ReceiptImage(string Extension, string Base64, byte[] Bytes)
    {
        public MemoryStream Stream => new(Bytes);
    }
}
