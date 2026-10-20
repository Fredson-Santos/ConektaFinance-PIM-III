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
    ITransactionRepository transactionRepository,
    IBudgetRepository budgetRepository,
    IUserRepository userRepository,
    ICopilotAiClient aiClient,
    IConfiguration configuration) : ICopilotService
{
    public async Task<CopilotHistoryResponse> GetHistoryAsync(int userId)
    {
        var messages = await chatRepository.ListRecentAsync(userId, 50);
        return new CopilotHistoryResponse(messages.OrderBy(m => m.Id).Select(Map).ToList());
    }

    public async Task<CopilotExchangeResponse> SendMessageAsync(int userId, string content)
    {
        var trimmed = content.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            throw AppException.BadRequest("Mensagem vazia", "Escreva uma mensagem para o assistente.");

        var limit = configuration.GetValue("Copilot:DailyMessageLimit", 30);
        var sentToday = await chatRepository.CountSinceAsync(userId, ChatRole.User, DateTime.UtcNow.Date);
        if (sentToday >= limit)
            throw AppException.TooManyRequests("Limite diario atingido",
                "Voce atingiu o limite de mensagens do assistente por hoje. Volte amanha.");

        var context = await BuildContextAsync(userId);

        var userMessage = new ChatMessage { UserId = userId, Role = ChatRole.User, Content = trimmed };
        await chatRepository.AddAsync(userMessage);

        var reply = await aiClient.ReplyAsync(trimmed, context);
        var assistantMessage = new ChatMessage
        {
            UserId = userId,
            Role = ChatRole.Assistant,
            Content = reply.Content,
            ActionPayload = reply.Actions.Count > 0
                ? JsonSerializer.Serialize(reply.Actions.Select(a => new CopilotActionDto(a.Tool, a.Args)))
                : null
        };
        await chatRepository.AddAsync(assistantMessage);

        return new CopilotExchangeResponse(Map(userMessage), Map(assistantMessage));
    }

    public Task ClearHistoryAsync(int userId) =>
        chatRepository.ClearAsync(userId);

    private async Task<CopilotFinancialContext> BuildContextAsync(int userId)
    {
        var now = DateTime.UtcNow;
        var start = new DateTime(now.Year, now.Month, 1);
        var end = start.AddMonths(1);
        var allEnd = new DateTime(2100, 1, 1);

        var user = await userRepository.GetByIdAsync(userId);
        var income = await transactionRepository.SumAsync(userId, TransactionType.Income, start, end);
        var expense = await transactionRepository.SumAsync(userId, TransactionType.Expense, start, end);
        var allIncome = await transactionRepository.SumAsync(userId, TransactionType.Income, new DateTime(2000, 1, 1), allEnd);
        var allExpense = await transactionRepository.SumAsync(userId, TransactionType.Expense, new DateTime(2000, 1, 1), allEnd);

        var budgets = await budgetRepository.ListByPeriodAsync(userId, now.Month, now.Year);
        var spentByCategory = (await transactionRepository.SumByCategoryAsync(userId, TransactionType.Expense, start, end))
            .ToDictionary(s => s.CategoryId, s => s.Total);
        var categories = budgets
            .Where(b => b.Category.Kind == CategoryKind.Expense && b.LimitValue > 0)
            .Select(b =>
            {
                var spent = spentByCategory.GetValueOrDefault(b.CategoryId, 0m);
                return new CategoryBudgetSnapshot(
                    b.Category.Name,
                    spent,
                    b.LimitValue,
                    Math.Round(BudgetStatus.PercentageUsed(spent, b.LimitValue), 1),
                    BudgetStatus.EvaluateStatus(spent, b.LimitValue));
            })
            .ToList();

        return new CopilotFinancialContext(
            allIncome - allExpense,
            income,
            expense,
            user?.MonthlyCeiling ?? 0m,
            categories,
            categories.Where(c => c.Status == "over").Select(c => c.Name).ToList());
    }

    internal static CopilotMessageDto Map(ChatMessage message) => new(
        message.Id,
        message.Role == ChatRole.User ? "user" : "assistant",
        message.Content,
        ParseActions(message.ActionPayload),
        message.CreatedAt);

    internal static List<CopilotActionDto>? ParseActions(string? payload) =>
        string.IsNullOrWhiteSpace(payload)
            ? null
            : JsonSerializer.Deserialize<List<CopilotActionDto>>(payload);
}
