using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Exceptions;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Application.Services;

public class BudgetService(
    IBudgetRepository budgetRepository,
    ICategoryRepository categoryRepository,
    ITransactionRepository transactionRepository) : IBudgetService
{
    public async Task<BudgetResponse> UpsertAsync(int userId, BudgetUpsertRequest request)
    {
        ValidatePeriod(request.Month, request.Year);
        var category = await categoryRepository.GetByIdAndUserAsync(request.CategoryId, userId)
            ?? throw AppException.NotFound("Categoria nao encontrada", "Verifique o identificador informado.");
        if (category.Kind != CategoryKind.Expense)
            throw AppException.BadRequest("Categoria sem teto",
                "Apenas categorias de despesa aceitam teto orçamentario.");

        var budget = await budgetRepository.GetAsync(userId, request.CategoryId, request.Month, request.Year);
        if (budget is null)
        {
            budget = new Budget
            {
                UserId = userId,
                CategoryId = request.CategoryId,
                LimitValue = request.LimitValue,
                PeriodMonth = request.Month,
                PeriodYear = request.Year
            };
            await budgetRepository.AddAsync(budget);
        }
        else
        {
            budget.LimitValue = request.LimitValue;
            await budgetRepository.UpdateAsync(budget);
        }

        var spent = await GetSpentAsync(userId, request.CategoryId, request.Month, request.Year);
        return Map(category, budget, spent);
    }

    public async Task<List<BudgetResponse>> ListAsync(int userId, int month, int year)
    {
        ValidatePeriod(month, year);
        var budgets = await budgetRepository.ListByPeriodAsync(userId, month, year);
        if (budgets.Count == 0)
            return [];

        var start = new DateTime(year, month, 1);
        var end = start.AddMonths(1);
        var spentByCategory = (await transactionRepository.SumByCategoryAsync(userId, TransactionType.Expense, start, end))
            .ToDictionary(s => s.CategoryId, s => s.Total);

        return budgets
            .Where(b => b.Category.Kind == CategoryKind.Expense)
            .Select(b => Map(b.Category, b, spentByCategory.GetValueOrDefault(b.CategoryId, 0m)))
            .ToList();
    }

    private Task<decimal> GetSpentAsync(int userId, int categoryId, int month, int year)
    {
        var start = new DateTime(year, month, 1);
        return transactionRepository.SumAsync(userId, TransactionType.Expense, start, start.AddMonths(1), categoryId);
    }

    private static void ValidatePeriod(int month, int year)
    {
        if (month is < 1 or > 12)
            throw AppException.BadRequest("Mes invalido", "Informe um mes entre 1 e 12.");
        if (year < 2020)
            throw AppException.BadRequest("Ano invalido", "Informe um ano a partir de 2020.");
    }

    private static BudgetResponse Map(Category category, Budget budget, decimal spent) => new(
        budget.CategoryId,
        category.Name,
        category.ColorCode,
        category.Icon,
        budget.LimitValue,
        spent,
        Math.Round(BudgetStatus.PercentageUsed(spent, budget.LimitValue), 1),
        BudgetStatus.EvaluateStatus(spent, budget.LimitValue),
        budget.PeriodMonth,
        budget.PeriodYear);
}
