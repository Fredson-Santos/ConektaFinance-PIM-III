using PIM_III_Backend.Domain.Entities;

namespace PIM_III_Backend.Domain.Interfaces;

public interface IBudgetRepository
{
    Task<IEnumerable<Budget>> GetByUserIdAsync(int userId);
    Task<Budget?> GetByUserAndCategoryAsync(int userId, int categoryId, int month, int year);
    Task AddAsync(Budget budget);
    Task UpdateAsync(Budget budget);
}

public interface IAlertRepository
{
    Task<IEnumerable<Alert>> GetByUserIdAsync(int userId, bool? onlyUnread = null);
    Task<Alert?> GetByIdAsync(int id);
    Task AddAsync(Alert alert);
    Task UpdateAsync(Alert alert);
    Task DeleteAsync(int id);
}
