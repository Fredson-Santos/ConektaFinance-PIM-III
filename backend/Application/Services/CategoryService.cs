using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Exceptions;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Application.Services;

public class CategoryService(
    ICategoryRepository categoryRepository,
    IBudgetRepository budgetRepository,
    ITransactionRepository transactionRepository) : ICategoryService
{
    public async Task<List<CategoryResponse>> ListAsync(int userId, string? kind, int? month, int? year)
    {
        var kindFilter = ParseKind(kind);
        var categories = await categoryRepository.ListAsync(userId, kindFilter);
        if (month is null || year is null)
            return categories.Select(MapBasic).ToList();

        var start = new DateTime(year!.Value, month!.Value, 1);
        var end = start.AddMonths(1);
        var budgets = await budgetRepository.ListByPeriodAsync(userId, month.Value, year.Value);
        var spentByCategory = (await transactionRepository.SumByCategoryAsync(userId, TransactionType.Expense, start, end))
            .ToDictionary(s => s.CategoryId, s => s.Total);
        var budgetByCategory = budgets
            .Where(b => b.Category.Kind == CategoryKind.Expense)
            .ToDictionary(b => b.CategoryId, b => b.LimitValue);

        return categories.Select(c =>
        {
            var response = MapBasic(c);
            if (c.Kind != CategoryKind.Expense)
                return response;
            var spent = spentByCategory.GetValueOrDefault(c.Id, 0m);
            var limit = budgetByCategory.GetValueOrDefault(c.Id, 0m);
            return response with { Spent = spent, Limit = limit, Status = BudgetStatus.EvaluateStatus(spent, limit) };
        }).ToList();
    }

    public async Task<CategoryResponse> CreateAsync(int userId, CreateCategoryRequest request)
    {
        var name = request.Name.Trim();
        if (await categoryRepository.ExistsNameAsync(userId, name))
            throw AppException.Conflict("Categoria duplicada", "Ja existe uma categoria com este nome.");

        var category = new Category
        {
            UserId = userId,
            Name = name,
            Description = request.Description?.Trim(),
            ColorCode = request.ColorCode,
            Icon = string.IsNullOrWhiteSpace(request.Icon) ? "Tag" : request.Icon.Trim(),
            Kind = request.Kind,
            SortOrder = 99
        };
        await categoryRepository.AddAsync(category);
        return MapBasic(category);
    }

    public async Task<CategoryResponse> UpdateAsync(int userId, int categoryId, UpdateCategoryRequest request)
    {
        var category = await categoryRepository.GetByIdAndUserAsync(categoryId, userId)
            ?? throw AppException.NotFound("Categoria nao encontrada", "Verifique o identificador informado.");

        if (!string.IsNullOrWhiteSpace(request.Name) && request.Name.Trim() != category.Name)
        {
            if (await categoryRepository.ExistsNameAsync(userId, request.Name.Trim(), categoryId))
                throw AppException.Conflict("Categoria duplicada", "Ja existe uma categoria com este nome.");
            category.Name = request.Name.Trim();
        }
        if (request.Description is not null)
            category.Description = request.Description.Trim();
        if (!string.IsNullOrWhiteSpace(request.ColorCode))
            category.ColorCode = request.ColorCode;
        if (!string.IsNullOrWhiteSpace(request.Icon))
            category.Icon = request.Icon.Trim();
        if (request.SortOrder.HasValue)
            category.SortOrder = request.SortOrder.Value;

        await categoryRepository.UpdateAsync(category);
        return MapBasic(category);
    }

    public async Task DeleteAsync(int userId, int categoryId)
    {
        var category = await categoryRepository.GetByIdAndUserAsync(categoryId, userId)
            ?? throw AppException.NotFound("Categoria nao encontrada", "Verifique o identificador informado.");

        if (await categoryRepository.CountTransactionsAsync(categoryId) > 0)
            throw AppException.Conflict("Categoria em uso",
                "Existem lancamentos vinculados a esta categoria. Recategorize-os antes de excluir.");

        await categoryRepository.DeleteAsync(category);
    }

    private static CategoryKind? ParseKind(string? kind)
    {
        if (string.IsNullOrWhiteSpace(kind))
            return null;
        if (Enum.TryParse<CategoryKind>(kind, ignoreCase: true, out var parsed))
            return parsed;
        throw AppException.BadRequest("Tipo invalido", "Use expense ou income.");
    }

    private static CategoryResponse MapBasic(Category c) => new(
        c.Id, c.Name, c.Description, c.ColorCode, c.Icon, c.Kind, c.SortOrder, c.IsSystem, null, null, null);
}
