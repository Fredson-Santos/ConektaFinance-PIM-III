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

public record MonthlyClosingCategoryDto(int Id, string Name, decimal Total);

public record MonthlyClosingResponse(
    int Year,
    int Month,
    decimal TotalIncome,
    decimal TotalExpense,
    decimal Balance,
    decimal MonthlyCeiling,
    decimal? CeilingPercentage,
    MonthlyClosingCategoryDto? TopCategory,
    int TransactionCount,
    DateTime ClosedAt);
