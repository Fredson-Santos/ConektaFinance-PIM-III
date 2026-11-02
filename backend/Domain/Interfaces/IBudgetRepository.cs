using PIM_III_Backend.Domain.Entities;

namespace PIM_III_Backend.Domain.Interfaces;

public interface IBudgetRepository
{
    Task<List<Budget>> ListByPeriodAsync(int userId, int month, int year);
    Task<Budget?> GetAsync(int userId, int categoryId, int month, int year);
    Task AddAsync(Budget budget);
    Task UpdateAsync(Budget budget);
    Task DeleteAsync(Budget budget);
    Task DeleteAllForUserAsync(int userId);
}
