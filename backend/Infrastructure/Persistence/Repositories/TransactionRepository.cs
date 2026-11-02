using Microsoft.EntityFrameworkCore;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Domain.Interfaces;
using PIM_III_Backend.Domain.Models;
using PIM_III_Backend.Infrastructure.Persistence;

namespace PIM_III_Backend.Infrastructure.Persistence.Repositories;

public class TransactionRepository(AppDbContext context) : ITransactionRepository
{
    public Task<List<Transaction>> ListByPeriodAsync(int userId, DateTime start, DateTime end) =>
        context.Transactions.AsNoTracking()
            .Include(t => t.Category)
            .Where(t => t.UserId == userId && t.TransactionDate >= start && t.TransactionDate < end)
            .OrderByDescending(t => t.TransactionDate)
            .ThenByDescending(t => t.Id)
            .ToListAsync();

    public async Task<PagedResult<Transaction>> GetPagedAsync(TransactionFilter filter)
    {
        var query = BuildFilter(context.Transactions.AsNoTracking().Include(t => t.Category), filter);
        query = ApplySort(query, filter);
        var totalItems = await query.CountAsync();
        var items = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();
        return new PagedResult<Transaction>(items, totalItems, filter.Page, filter.PageSize);
    }

    public Task<decimal> SumFilteredAsync(TransactionFilter filter) =>
        BuildFilter(context.Transactions.AsNoTracking(), filter).SumAsync(t => t.Value);

    public Task<Transaction?> GetByIdAsync(int id) =>
        context.Transactions.Include(t => t.Category).FirstOrDefaultAsync(t => t.Id == id);

    public Task<bool> ExistsExternalAsync(int userId, string externalId) =>
        context.Transactions.AnyAsync(t => t.UserId == userId && t.ExternalId == externalId);

    public Task<decimal> SumAsync(int userId, TransactionType type, DateTime start, DateTime end, int? categoryId = null)
    {
        var query = context.Transactions.Where(t =>
            t.UserId == userId && t.Type == type && t.Status == TransactionStatus.Active &&
            t.TransactionDate >= start && t.TransactionDate < end);
        if (categoryId.HasValue)
            query = query.Where(t => t.CategoryId == categoryId.Value);
        return query.SumAsync(t => t.Value);
    }

    public Task<decimal> SumRecurrentAsync(int userId, TransactionType type, DateTime start, DateTime end) =>
        context.Transactions
            .Where(t => t.UserId == userId && t.Type == type && t.Status == TransactionStatus.Active &&
                        t.IsRecurrent && t.TransactionDate >= start && t.TransactionDate < end)
            .SumAsync(t => t.Value);

    public Task<int> CountRecurrentAsync(int userId, TransactionType type, DateTime start, DateTime end) =>
        context.Transactions
            .Where(t => t.UserId == userId && t.Type == type && t.Status == TransactionStatus.Active &&
                        t.IsRecurrent && t.TransactionDate >= start && t.TransactionDate < end)
            .CountAsync();

    public Task<Transaction?> GetLargestExpenseAsync(int userId, DateTime start, DateTime end) =>
        context.Transactions
            .Include(t => t.Category)
            .Where(t => t.UserId == userId && t.Type == TransactionType.Expense &&
                        t.Status == TransactionStatus.Active &&
                        t.TransactionDate >= start && t.TransactionDate < end)
            .OrderByDescending(t => t.Value)
            .FirstOrDefaultAsync();

    public async Task<List<CategorySum>> SumByCategoryAsync(int userId, TransactionType type, DateTime start, DateTime end)    {
        var rows = await context.Transactions
            .Where(t => t.UserId == userId && t.Type == type && t.Status == TransactionStatus.Active &&
                        t.TransactionDate >= start && t.TransactionDate < end)
            .GroupBy(t => t.CategoryId)
            .Select(g => new { CategoryId = g.Key, Total = g.Sum(t => t.Value) })
            .ToListAsync();
        return rows.Select(r => new CategorySum(r.CategoryId, r.Total)).ToList();
    }

    public async Task<List<DailySum>> SumByDayAsync(int userId, TransactionType type, DateTime start, DateTime end)
    {
        var sums = await context.Transactions
            .Where(t => t.UserId == userId && t.Type == type && t.Status == TransactionStatus.Active &&
                        t.TransactionDate >= start && t.TransactionDate < end)
            .GroupBy(t => t.TransactionDate.Date)
            .Select(g => new { Date = g.Key, Total = g.Sum(t => t.Value) })
            .ToListAsync();
        return sums.Select(s => new DailySum(s.Date, s.Total)).ToList();
    }

    public async Task AddAsync(Transaction transaction)
    {
        context.Transactions.Add(transaction);
        await context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Transaction transaction)
    {
        transaction.UpdatedAt = DateTime.UtcNow;
        context.Transactions.Update(transaction);
        await context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Transaction transaction)
    {
        context.Transactions.Remove(transaction);
        await context.SaveChangesAsync();
    }

    public async Task DeleteAllForUserAsync(int userId)
    {
        var transactions = context.Transactions.Where(t => t.UserId == userId);
        context.Transactions.RemoveRange(transactions);
        await context.SaveChangesAsync();
    }

    private static IQueryable<Transaction> BuildFilter(IQueryable<Transaction> query, TransactionFilter filter)
    {
        query = query.Where(t => t.UserId == filter.UserId);
        if (filter.CategoryId.HasValue)
            query = query.Where(t => t.CategoryId == filter.CategoryId.Value);
        if (filter.Type.HasValue)
            query = query.Where(t => t.Type == filter.Type.Value);
        if (filter.Start.HasValue)
            query = query.Where(t => t.TransactionDate >= filter.Start.Value);
        if (filter.End.HasValue)
            query = query.Where(t => t.TransactionDate < filter.End.Value);
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var term = filter.Search.Trim().ToLower();
            query = query.Where(t => t.Description.ToLower().Contains(term));
        }
        return query;
    }

    private static IQueryable<Transaction> ApplySort(IQueryable<Transaction> query, TransactionFilter filter)
    {
        var ascending = filter.Order.Equals("asc", StringComparison.OrdinalIgnoreCase);
        return filter.SortBy?.ToLower() switch
        {
            "value" => ascending ? query.OrderBy(t => t.Value) : query.OrderByDescending(t => t.Value),
            _ => ascending
                ? query.OrderBy(t => t.TransactionDate).ThenBy(t => t.Id)
                : query.OrderByDescending(t => t.TransactionDate).ThenByDescending(t => t.Id)
        };
    }
}
