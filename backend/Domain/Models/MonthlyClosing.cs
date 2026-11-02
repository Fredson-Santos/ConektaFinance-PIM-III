namespace PIM_III_Backend.Domain.Models;

// Linha de monthly_closings, gravada pela procedure sp_fechamento_mensal.
public class MonthlyClosing
{
    public int PeriodYear { get; init; }
    public int PeriodMonth { get; init; }
    public decimal TotalIncome { get; init; }
    public decimal TotalExpense { get; init; }
    public decimal Balance { get; init; }
    public decimal MonthlyCeiling { get; init; }
    public decimal? CeilingPercentage { get; init; }
    public int? TopCategoryId { get; init; }
    public decimal TopCategoryTotal { get; init; }
    public int TransactionCount { get; init; }
    public DateTime ClosedAt { get; init; }
}
