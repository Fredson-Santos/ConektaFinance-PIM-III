namespace PIM_III_Backend.Application.Dtos;

public record BudgetUpsertRequest(int CategoryId, decimal LimitValue, int Month, int Year);

public record BudgetResponse(
    int CategoryId,
    string CategoryName,
    string ColorCode,
    string Icon,
    decimal LimitValue,
    decimal Spent,
    double PercentageUsed,
    string Status,
    int Month,
    int Year);
