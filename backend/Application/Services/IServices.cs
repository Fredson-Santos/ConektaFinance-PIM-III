using PIM_III_Backend.Application.Dtos.Categories;
using PIM_III_Backend.Application.Dtos.Expenses;

namespace PIM_III_Backend.Application.Services;

public interface ICategoryService
{
    Task<IEnumerable<CategoryResponse>> GetAllAsync();
    Task<CategoryResponse?> GetByIdAsync(int id);
    Task<CategoryResponse> CreateAsync(CreateCategoryRequest request);
    Task UpdateAsync(int id, UpdateCategoryRequest request);
    Task DeleteAsync(int id);
}

public interface IExpenseService
{
    Task<IEnumerable<ExpenseResponse>> GetUserExpensesAsync(int userId, DateTime? start = null, DateTime? end = null, int? categoryId = null);
    Task<ExpenseResponse?> GetByIdAsync(int id, int userId);
    Task<ExpenseResponse> CreateAsync(int userId, CreateExpenseRequest request);
    Task UpdateAsync(int id, int userId, UpdateExpenseRequest request);
    Task DeleteAsync(int id, int userId);
}
