using PIM_III_Backend.Domain.Entities;

namespace PIM_III_Backend.Domain.Interfaces;

public interface ICategoryRepository
{
    Task<IEnumerable<Category>> GetAllAsync();
    Task<Category?> GetByIdAsync(int id);
    Task AddAsync(Category category);
    Task UpdateAsync(Category category);
    Task DeleteAsync(int id);
}

public interface IExpenseRepository
{
    Task<IEnumerable<Expense>> GetByUserIdAsync(int userId, DateTime? start = null, DateTime? end = null, int? categoryId = null);
    Task<Expense?> GetByIdAsync(int id);
    Task AddAsync(Expense expense);
    Task UpdateAsync(Expense expense);
    Task DeleteAsync(int id);
}

public interface IChatRepository
{
    Task<IEnumerable<ChatMessage>> GetByUserIdAsync(int userId);
    Task AddAsync(ChatMessage message);
    Task ClearHistoryAsync(int userId);
}
