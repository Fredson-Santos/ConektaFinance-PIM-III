using PIM_III_Backend.Application.Services;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Application.Services;

public class AlertService(
    IAlertRepository alertRepository,
    IBudgetRepository budgetRepository,
    ICategoryRepository categoryRepository,
    ITransactionRepository transactionRepository) : IAlertService
{
    public async Task CheckBudgetAlertsAsync(int userId, int categoryId, int year, int month)
    {
        var category = await categoryRepository.GetByIdAndUserAsync(categoryId, userId);
        if (category is null || category.Kind != CategoryKind.Expense)
            return;

        var budget = await budgetRepository.GetAsync(userId, categoryId, month, year);
        if (budget is null || budget.LimitValue <= 0)
            return;

        var start = new DateTime(year, month, 1);
        var end = start.AddMonths(1);
        var spent = await transactionRepository.SumAsync(userId, TransactionType.Expense, start, end, categoryId);
        var percentage = BudgetStatus.PercentageUsed(spent, budget.LimitValue);

        if (percentage > 100)
            await UpsertAsync(userId, categoryId,
                $"cat:{categoryId}:{year}-{month:D2}:exceeded",
                AlertType.BudgetExceeded,
                $"{category.Name} acima do teto",
                $"Orcamento excedido em R$ {Math.Abs(budget.LimitValue - spent):F2}. Limite de R$ {budget.LimitValue:F2}.");
        else if (percentage >= 80)
            await UpsertAsync(userId, categoryId,
                $"cat:{categoryId}:{year}-{month:D2}:limit",
                AlertType.CategoryLimit,
                $"{category.Name} — {Math.Round(percentage)}% do teto",
                $"Restam R$ {Math.Max(0, budget.LimitValue - spent):F2} ate o fechamento do mes.");
    }

    private async Task UpsertAsync(int userId, int categoryId, string dedupKey, AlertType type, string title, string message)
    {
        var existing = await alertRepository.GetByDedupKeyAsync(userId, dedupKey);
        if (existing is null)
        {
            await alertRepository.AddAsync(new Alert
            {
                UserId = userId,
                CategoryId = categoryId,
                Type = type,
                Title = title,
                Message = message,
                DedupKey = dedupKey
            });
            return;
        }
        existing.Type = type;
        existing.Title = title;
        existing.Message = message;
        await alertRepository.UpdateAsync(existing);
    }
}
