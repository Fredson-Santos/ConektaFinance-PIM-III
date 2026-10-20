using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Exceptions;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Domain.Interfaces;
using PIM_III_Backend.Domain.Models;

namespace PIM_III_Backend.Application.Services;

public class TransactionService(
    ITransactionRepository transactionRepository,
    ICategoryRepository categoryRepository,
    IAlertService alertService) : ITransactionService
{
    public async Task<TransactionListResponse> ListAsync(TransactionFilter filter)
    {
        Normalize(filter);
        var result = await transactionRepository.GetPagedAsync(filter);
        var items = result.Items.Select(Map).ToList();
        var meta = new PaginationMeta(result.Page, result.PageSize, result.TotalItems, result.TotalPages);
        return new TransactionListResponse(items, meta);
    }

    public async Task<decimal> SumAsync(TransactionFilter filter)
    {
        Normalize(filter);
        return await transactionRepository.SumFilteredAsync(filter);
    }

    public async Task<TransactionResponse> GetByIdAsync(int userId, int id)
    {
        var transaction = await GetOwnedAsync(userId, id);
        return Map(transaction);
    }

    public async Task<TransactionResponse> CreateAsync(int userId, CreateTransactionRequest request)
    {
        var category = await GetCompatibleCategoryAsync(userId, request.CategoryId, request.Type);
        ValidateDate(request.TransactionDate);

        var transaction = new Transaction
        {
            UserId = userId,
            CategoryId = category.Id,
            Category = category,
            Type = request.Type,
            Description = request.Description.Trim(),
            Value = request.Value,
            TransactionDate = DateTime.SpecifyKind(request.TransactionDate.Date, DateTimeKind.Utc),
            PaymentMethod = request.PaymentMethod,
            Observation = request.Observation?.Trim(),
            IsRecurrent = request.IsRecurrent ?? false,
            Status = TransactionStatus.Active,
            Source = TransactionSource.Manual
        };
        await transactionRepository.AddAsync(transaction);

        if (transaction.Type == TransactionType.Expense)
            await alertService.CheckBudgetAlertsAsync(userId, category.Id,
                transaction.TransactionDate.Year, transaction.TransactionDate.Month);

        return Map(transaction);
    }

    public async Task<TransactionResponse> UpdateAsync(int userId, int id, UpdateTransactionRequest request)
    {
        var transaction = await GetOwnedAsync(userId, id);
        var category = await GetCompatibleCategoryAsync(userId, request.CategoryId, request.Type);
        ValidateDate(request.TransactionDate);

        transaction.CategoryId = category.Id;
        transaction.Category = category;
        transaction.Type = request.Type;
        transaction.Description = request.Description.Trim();
        transaction.Value = request.Value;
        transaction.TransactionDate = DateTime.SpecifyKind(request.TransactionDate.Date, DateTimeKind.Utc);
        transaction.PaymentMethod = request.PaymentMethod;
        transaction.Observation = request.Observation?.Trim();
        transaction.IsRecurrent = request.IsRecurrent ?? false;
        if (request.Status.HasValue)
            transaction.Status = request.Status.Value;
        await transactionRepository.UpdateAsync(transaction);

        if (transaction.Type == TransactionType.Expense)
            await alertService.CheckBudgetAlertsAsync(userId, category.Id,
                transaction.TransactionDate.Year, transaction.TransactionDate.Month);

        return Map(transaction);
    }

    public async Task DeleteAsync(int userId, int id)
    {
        var transaction = await GetOwnedAsync(userId, id);
        await transactionRepository.DeleteAsync(transaction);
    }

    private async Task<Transaction> GetOwnedAsync(int userId, int id)
    {
        var transaction = await transactionRepository.GetByIdAsync(id);
        if (transaction is null || transaction.UserId != userId)
            throw AppException.NotFound("Lancamento nao encontrado", "Verifique o identificador informado.");
        return transaction;
    }

    private async Task<Category> GetCompatibleCategoryAsync(int userId, int categoryId, TransactionType type)
    {
        var category = await categoryRepository.GetByIdAndUserAsync(categoryId, userId)
            ?? throw AppException.NotFound("Categoria nao encontrada", "Verifique o identificador informado.");
        var expectedKind = type == TransactionType.Expense ? CategoryKind.Expense : CategoryKind.Income;
        if (category.Kind != expectedKind)
            throw AppException.BadRequest("Tipo de lancamento incompativel",
                "A categoria escolhida nao aceita este tipo de lancamento.");
        return category;
    }

    private static void ValidateDate(DateTime date)
    {
        if (date.Date > DateTime.UtcNow.Date)
            throw AppException.BadRequest("Data futura nao permitida",
                "Registre lancamentos com a data de hoje ou anterior.");
    }

    private static void Normalize(TransactionFilter filter)
    {
        filter.Page = Math.Max(1, filter.Page);
        filter.PageSize = Math.Clamp(filter.PageSize, 1, 100);
        if (!string.IsNullOrWhiteSpace(filter.Search))
            filter.Search = filter.Search.Trim().ToLowerInvariant();
    }

    private static TransactionResponse Map(Transaction t) => new(
        t.Id, t.Type, t.Description, t.Value, t.TransactionDate, t.PaymentMethod, t.Observation,
        t.IsRecurrent, t.Status, t.Source,
        new CategoryBrief(t.Category.Id, t.Category.Name, t.Category.ColorCode, t.Category.Icon),
        t.CreatedAt);
}
