using PIM_III_Backend.Application.Dtos.Alerts;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Application.Services;

public class AlertService : IAlertService
{
    private readonly IAlertRepository _alertRepository;
    private readonly IBudgetRepository _budgetRepository;
    private readonly IExpenseRepository _expenseRepository;

    public AlertService(IAlertRepository alertRepository, IBudgetRepository budgetRepository, IExpenseRepository expenseRepository)
    {
        _alertRepository = alertRepository;
        _budgetRepository = budgetRepository;
        _expenseRepository = expenseRepository;
    }

    public async Task<IEnumerable<AlertResponse>> GetUserAlertsAsync(int userId, bool onlyUnread = false)
    {
        var alerts = await _alertRepository.GetByUserIdAsync(userId, onlyUnread);
        return alerts.Select(a => new AlertResponse(
            a.Id,
            a.Type == AlertType.BudgetExceeded ? "orcamento_excedido" :
            a.Type == AlertType.CategoryLimit ? "categoria_limite" : "gasto_alto",
            a.Title,
            a.Message,
            a.CategoryId,
            a.Category?.Name,
            a.IsRead,
            a.CreatedAt
        ));
    }

    public async Task MarkAsReadAsync(int id, int userId)
    {
        var alert = await _alertRepository.GetByIdAsync(id);
        if (alert == null || alert.UserId != userId) return;

        alert.IsRead = true;
        await _alertRepository.UpdateAsync(alert);
    }

    public async Task DeleteAsync(int id, int userId)
    {
        var alert = await _alertRepository.GetByIdAsync(id);
        if (alert == null || alert.UserId != userId) return;
        await _alertRepository.DeleteAsync(id);
    }

    public async Task CheckBudgetAlertsAsync(int userId, int categoryId, decimal currentValue)
    {
        var now = DateTime.UtcNow;
        var budget = await _budgetRepository.GetByUserAndCategoryAsync(userId, categoryId, now.Month, now.Year);
        
        if (budget != null)
        {
            var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var monthEnd = monthStart.AddMonths(1).AddTicks(-1); // 23:59:59.9999999 do último dia
            var expenses = await _expenseRepository.GetByUserIdAsync(userId,
                monthStart,
                monthEnd,
                categoryId);
            
            var totalSpent = expenses.Sum(x => x.Value);

            if (totalSpent > budget.LimitValue)
            {
                await _alertRepository.AddAsync(new Alert
                {
                    UserId = userId,
                    CategoryId = categoryId,
                    Type = AlertType.BudgetExceeded,
                    Title = "Orçamento Excedido",
                    Message = $"Orçamento da categoria excedido! Limite: {budget.LimitValue:C2}, Gasto: {totalSpent:C2}",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }
            else if (totalSpent > budget.LimitValue * 0.8m)
            {
                await _alertRepository.AddAsync(new Alert
                {
                    UserId = userId,
                    CategoryId = categoryId,
                    Type = AlertType.CategoryLimit,
                    Title = "Quase no Limite",
                    Message = $"Você atingiu 80% do orçamento da categoria. Gasto: {totalSpent:C2}",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }
        }
    }
}
