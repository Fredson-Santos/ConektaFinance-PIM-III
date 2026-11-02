using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;

namespace PIM_III_Backend.Domain.Interfaces;

public interface ICategoryRepository
{
    Task<List<Category>> ListAsync(int userId, CategoryKind? kind = null);
    Task<Category?> GetByIdAsync(int id);
    Task<Category?> GetByIdAndUserAsync(int id, int userId);
    Task<bool> ExistsNameAsync(int userId, string name, int? excludeId = null);
    Task<int> CountTransactionsAsync(int categoryId);
    Task AddAsync(Category category);
    Task UpdateAsync(Category category);
    Task DeleteAsync(Category category);
    Task AddRangeAsync(IEnumerable<Category> categories);
}
