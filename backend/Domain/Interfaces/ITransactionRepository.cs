using ConektaFinance.Api.Domain.Entities;
using ConektaFinance.Api.Domain.Enums;
using ConektaFinance.Api.Domain.Models;

namespace ConektaFinance.Api.Domain.Interfaces;

public interface ITransactionRepository
{
    Task<List<Transaction>> ListByPeriodAsync(int userId, DateTime start, DateTime end);
    Task<PagedResult<Transaction>> GetPagedAsync(TransactionFilter filter);
    Task<decimal> SumFilteredAsync(TransactionFilter filter);
    Task<Transaction?> GetByIdAsync(int id);
    Task<bool> ExistsExternalAsync(int userId, string externalId);
    Task<decimal> SumAsync(int userId, TransactionType type, DateTime start, DateTime end, int? categoryId = null);
    Task<decimal> SumRecurrentAsync(int userId, TransactionType type, DateTime start, DateTime end);
    Task<int> CountRecurrentAsync(int userId, TransactionType type, DateTime start, DateTime end);
    Task<Transaction?> GetLargestExpenseAsync(int userId, DateTime start, DateTime end);
    Task<List<CategorySum>> SumByCategoryAsync(int userId, TransactionType type, DateTime start, DateTime end);
    Task<List<DailySum>> SumByDayAsync(int userId, TransactionType type, DateTime start, DateTime end);
    Task AddAsync(Transaction transaction);
    Task UpdateAsync(Transaction transaction);
    Task DeleteAsync(Transaction transaction);
    Task DeleteAllForUserAsync(int userId);
}

public record CategorySum(int CategoryId, decimal Total);
public record DailySum(DateTime Date, decimal Total);
