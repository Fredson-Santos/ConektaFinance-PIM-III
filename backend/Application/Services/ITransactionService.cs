using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Domain.Models;

namespace PIM_III_Backend.Application.Services;

public interface ITransactionService
{
    Task<TransactionListResponse> ListAsync(TransactionFilter filter);
    Task<decimal> SumAsync(TransactionFilter filter);
    Task<TransactionResponse> GetByIdAsync(int userId, int id);
    Task<TransactionResponse> CreateAsync(int userId, CreateTransactionRequest request);
    Task<TransactionResponse> UpdateAsync(int userId, int id, UpdateTransactionRequest request);
    Task DeleteAsync(int userId, int id);
}
