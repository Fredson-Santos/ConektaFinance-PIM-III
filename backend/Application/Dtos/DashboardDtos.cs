namespace PIM_III_Backend.Application.Dtos;

public record DashboardOverviewResponse(
    decimal Balance,
    decimal Income,
    decimal Expense,
    double? ExpenseToCeilingPercentage,
    double? IncomeChangePct,
    double? ExpenseChangePct,
    string Currency,
    DateTime UpdatedAt);

public record WeeklyDayResponse(string Weekday, decimal Value, double Percentage);

public record WeeklyExpensesResponse(decimal Total, decimal DailyAverage, List<WeeklyDayResponse> Days);

public record BudgetMeterResponse(
    int CategoryId,
    string Name,
    string ColorCode,
    string Icon,
    decimal Spent,
    decimal Limit,
    double Percentage);
