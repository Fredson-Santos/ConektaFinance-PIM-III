using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Exceptions;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Application.Services;

public class ReportService(
    ITransactionRepository transactionRepository,
    ICategoryRepository categoryRepository) : IReportService
{
    public async Task<ReportSummaryResponse> GetSummaryAsync(int userId, DateTime? start, DateTime? end)
    {
        var (periodStart, periodEnd) = NormalizePeriod(start, end);
        var income = await transactionRepository.SumAsync(userId, TransactionType.Income, periodStart, periodEnd);
        var expense = await transactionRepository.SumAsync(userId, TransactionType.Expense, periodStart, periodEnd);
        var balance = income - expense;
        var savingsRate = income > 0 ? Math.Round((double)(balance / income) * 100, 1) : (double?)null;

        var months = MonthsInPeriod(periodStart, periodEnd);
        var averageMonthlyExpense = Math.Round(expense / months, 2);

        var largest = await transactionRepository.GetLargestExpenseAsync(userId, periodStart, periodEnd);
        var recurrentSpent = await transactionRepository.SumRecurrentAsync(userId, TransactionType.Expense, periodStart, periodEnd);
        var recurrentCount = await transactionRepository.CountRecurrentAsync(userId, TransactionType.Expense, periodStart, periodEnd);

        var previousStart = periodStart.AddDays(-(periodEnd - periodStart).Days);
        var previousIncome = await transactionRepository.SumAsync(userId, TransactionType.Income, previousStart, periodStart);
        var previousExpense = await transactionRepository.SumAsync(userId, TransactionType.Expense, previousStart, periodStart);
        var comparison = new PreviousPeriodComparisonDto(
            ChangePct(income, previousIncome),
            ChangePct(expense, previousExpense));

        return new ReportSummaryResponse(
            income,
            expense,
            balance,
            savingsRate,
            averageMonthlyExpense,
            largest is null ? null : new LargestExpenseDto(largest.Value, largest.Description, largest.TransactionDate),
            recurrentSpent,
            recurrentCount,
            comparison);
    }

    public async Task<List<CategoryReportResponse>> GetByCategoryAsync(int userId, DateTime? start, DateTime? end, TransactionType kind)
    {
        var (periodStart, periodEnd) = NormalizePeriod(start, end);
        var sums = await transactionRepository.SumByCategoryAsync(userId, kind, periodStart, periodEnd);
        if (sums.Count == 0)
            return [];

        var categories = await categoryRepository.ListAsync(userId,
            kind == TransactionType.Income ? Domain.Enums.CategoryKind.Income : Domain.Enums.CategoryKind.Expense);
        var names = categories.ToDictionary(c => c.Id);
        var total = sums.Sum(s => s.Total);

        return sums
            .Select(s =>
            {
                names.TryGetValue(s.CategoryId, out var category);
                return new CategoryReportResponse(
                    s.CategoryId,
                    category?.Name ?? "Sem categoria",
                    category?.ColorCode ?? "#888888",
                    category?.Icon ?? "Tag",
                    s.Total,
                    total > 0 ? Math.Round((double)(s.Total / total) * 100, 1) : 0);
            })
            .OrderByDescending(c => c.Total)
            .ToList();
    }

    public async Task<List<TrendReportResponse>> GetTrendAsync(int userId, int months)
    {
        var effectiveMonths = Math.Clamp(months, 1, 24);
        var now = DateTime.UtcNow;
        var currentMonthStart = new DateTime(now.Year, now.Month, 1);
        var trend = new List<TrendReportResponse>();
        for (var offset = effectiveMonths - 1; offset >= 0; offset--)
        {
            var periodStart = currentMonthStart.AddMonths(-offset);
            var periodEnd = periodStart.AddMonths(1);
            var income = await transactionRepository.SumAsync(userId, TransactionType.Income, periodStart, periodEnd);
            var expense = await transactionRepository.SumAsync(userId, TransactionType.Expense, periodStart, periodEnd);
            trend.Add(new TrendReportResponse(
                $"{periodStart.Month:D2}/{periodStart.Year}",
                income,
                expense,
                income - expense));
        }
        return trend;
    }

    public async Task<List<DailyExpenseReportResponse>> GetDailyAsync(int userId, DateTime? start, DateTime? end)
    {
        var (periodStart, periodEnd) = NormalizePeriod(start, end);
        if ((periodEnd - periodStart).TotalDays > 366)
            throw AppException.BadRequest("Periodo muito longo", "Informe um periodo de ate 12 meses.");
        var sums = await transactionRepository.SumByDayAsync(userId, TransactionType.Expense, periodStart, periodEnd);
        var byDate = sums.ToDictionary(s => s.Date, s => s.Total);

        var daily = new List<DailyExpenseReportResponse>();
        for (var day = periodStart; day < periodEnd; day = day.AddDays(1))
            daily.Add(new DailyExpenseReportResponse(day.ToString("dd"), byDate.GetValueOrDefault(day, 0m)));
        return daily;
    }

    public async Task<PeriodExportResponse> GetExportAsync(int userId, DateTime? start, DateTime? end)
    {
        var (periodStart, periodEnd) = NormalizePeriod(start, end);
        var transactions = await transactionRepository.ListByPeriodAsync(userId, periodStart, periodEnd);
        return new PeriodExportResponse(periodStart, periodEnd,
            transactions.Select(TransactionService.MapResponse).ToList());
    }

    public static string BuildCsv(PeriodExportResponse export)
    {
        var builder = new System.Text.StringBuilder();
        builder.AppendLine("Data;Descricao;Categoria;Tipo;Valor;Forma de pagamento;Observacao");
        foreach (var transaction in export.Transactions)
        {
            builder.AppendJoin(';',
                transaction.TransactionDate.ToString("dd/MM/yyyy"),
                Escape(transaction.Description),
                Escape(transaction.Category.Name),
                transaction.Type == TransactionType.Expense ? "Despesa" : "Receita",
                transaction.Value.ToString("F2", System.Globalization.CultureInfo.CreateSpecificCulture("pt-BR")),
                transaction.PaymentMethod?.ToString() ?? string.Empty,
                Escape(transaction.Observation ?? string.Empty));
            builder.AppendLine();
        }
        return builder.ToString();
    }

    private static string Escape(string value)
    {
        var containsSeparator = value.Contains(';') || value.Contains('"') || value.Contains('\n');
        var escaped = value.Replace("\"", "\"\"");
        return containsSeparator ? $"\"{escaped}\"" : escaped;
    }

    private static (DateTime Start, DateTime End) NormalizePeriod(DateTime? start, DateTime? end)
    {
        var now = DateTime.UtcNow;
        var periodStart = start?.Date ?? new DateTime(now.Year, now.Month, 1);
        var periodEnd = end?.Date ?? new DateTime(now.Year, now.Month, 1).AddMonths(1);
        if (periodEnd <= periodStart)
            throw AppException.BadRequest("Periodo invalido", "A data final deve ser posterior a inicial.");
        return (periodStart, periodEnd);
    }

    private static int MonthsInPeriod(DateTime start, DateTime end)
    {
        var months = (end.Year - start.Year) * 12 + end.Month - start.Month;
        return Math.Max(1, months);
    }

    private static double? ChangePct(decimal current, decimal previous) =>
        previous == 0 ? null : Math.Round((double)(current - previous) / (double)previous * 100, 1);
}
