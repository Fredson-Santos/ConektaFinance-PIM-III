using ConektaFinance.Api.Application.Dtos;
using ConektaFinance.Api.Domain.Entities;
using ConektaFinance.Api.Domain.Enums;
using ConektaFinance.Api.Domain.Interfaces;

namespace ConektaFinance.Api.Application.Services;

public interface IAlertService
{
    Task CheckBudgetAlertsAsync(int userId, int categoryId, int year, int month);
    Task<List<AlertResponse>> ListAsync(int userId, bool unreadOnly);
    Task<int> CountUnreadAsync(int userId);
    Task MarkAsReadAsync(int userId, int alertId);
    Task DismissAsync(int userId, int alertId);
}

