using PIM_III_Backend.Application.Exceptions;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Application.Services;

public interface IAlertService
{
    Task CheckBudgetAlertsAsync(int userId, int categoryId, int year, int month);
}
