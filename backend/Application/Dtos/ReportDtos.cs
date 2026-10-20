namespace PIM_III_Backend.Application.Dtos;

public record LargestExpenseDto(decimal Amount, string Description, DateTime Date);

public record PreviousPeriodComparisonDto(double? IncomeChangePct, double? ExpenseChangePct);

public record ReportSummaryResponse(
    decimal TotalIncome,
    decimal TotalExpense,
    decimal Balance,
    double? SavingsRate,
    decimal AverageMonthlyExpense,
    LargestExpenseDto? LargestExpense,
    decimal RecurrentSpent,
    int RecurrentCount,
    PreviousPeriodComparisonDto? PreviousPeriod);

public record CategoryReportResponse(
    int CategoryId,
    string Name,
    string ColorCode,
    string Icon,
    decimal Total,
    double Percentage);

public record TrendReportResponse(string Period, decimal Income, decimal Expense, decimal Saved);

public record DailyExpenseReportResponse(string Day, decimal Value);
