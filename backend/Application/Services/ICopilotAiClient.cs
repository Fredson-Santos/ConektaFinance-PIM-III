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

public interface ICopilotAiClient
{
    Task<CopilotReply> ReplyAsync(string userMessage, CopilotFinancialContext context);
}
