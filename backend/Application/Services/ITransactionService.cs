using ConektaFinance.Api.Application.Dtos;
using ConektaFinance.Api.Domain.Models;

namespace ConektaFinance.Api.Application.Services;

public interface ITransactionService
{
    Task<TransactionListResponse> ListAsync(TransactionFilter filter);
    Task<decimal> SumAsync(TransactionFilter filter);
    Task<TransactionResponse> GetByIdAsync(int userId, int id);
    Task<TransactionResponse> CreateAsync(int userId, CreateTransactionRequest request);
    Task<TransactionResponse> UpdateAsync(int userId, int id, UpdateTransactionRequest request);
    Task DeleteAsync(int userId, int id);
}
