using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Application.Services;

public interface IAlertService
{
    Task CheckBudgetAlertsAsync(int userId, int categoryId, int year, int month);
    Task<List<AlertResponse>> ListAsync(int userId, bool unreadOnly);
    Task<int> CountUnreadAsync(int userId);
    Task MarkAsReadAsync(int userId, int alertId);
    Task DismissAsync(int userId, int alertId);
}

