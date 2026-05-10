namespace PIM_III_Backend.Application.Dtos.Reports;

public record ReportSummaryResponse(
    decimal TotalIncome, // Opcional por enquanto, vamos focar em TotalExpenses
    decimal TotalExpenses,
    decimal Balance,
    decimal HighestExpenseValue,
    string HighestExpenseDescription
);

public record CategoryReportResponse(
    int CategoryId,
    string CategoryName,
    decimal TotalValue,
    double Percentage
);

public record TrendReportResponse(
    string Period, // Ex: "Jan/2026"
    decimal Value
);
