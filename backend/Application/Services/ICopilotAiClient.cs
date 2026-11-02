namespace PIM_III_Backend.Application.Services;

public record CategoryBudgetSnapshot(string Name, decimal Spent, decimal Limit, double Percentage, string Status);

public record CopilotFinancialContext(
    decimal Balance,
    decimal MonthlyIncome,
    decimal MonthlyExpense,
    decimal MonthlyCeiling,
    List<CategoryBudgetSnapshot> Categories,
    List<string> OverBudgetCategories);

public record CopilotAction(string Tool, Dictionary<string, object?> Args);

public record CopilotReply(string Content, List<CopilotAction> Actions);

/// <summary>
/// Uma mensagem anterior da conversa, usada como janela de memória do agente.
/// </summary>
public record CopilotChatTurn(string Role, string Content);

/// <summary>
/// Dados estruturados extraídos de uma foto de nota fiscal pelo modelo de visão.
/// </summary>
public record ReceiptItem(string? Name, decimal? Value);

public record ReceiptExtract(
    string? Merchant,
    decimal? Total,
    string? Date,
    List<ReceiptItem> Items);

/// <summary>
/// Entrada completa do agente: mensagem atual, histórico, contexto financeiro
/// e dados extraídos de imagem (quando houver).
/// </summary>
public record CopilotAgentRequest(
    int UserId,
    string UserMessage,
    bool HasImage,
    ReceiptExtract? Receipt,
    IReadOnlyList<CopilotChatTurn> History,
    CopilotFinancialContext BaseContext);

/// <summary>
/// Abstração do provedor de IA. A implementação de LLM executa o loop de
/// function calling internamente; a implementação baseada em regras devolve
/// as intents clássicas sem rede.
/// </summary>
public interface ICopilotAiClient
{
    Task<CopilotReply> ReplyAsync(CopilotAgentRequest request);

    Task<ReceiptExtract?> ExtractReceiptAsync(string imageBase64);
}
