using PIM_III_Backend.Application.Dtos.Categories;
using PIM_III_Backend.Application.Dtos.Expenses;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Application.Services;

public class CategoryService : ICategoryService
{
    private readonly ICategoryRepository _repository;

    public CategoryService(ICategoryRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<CategoryResponse>> GetAllAsync()
    {
        var categories = await _repository.GetAllAsync();
        return categories.Select(c => new CategoryResponse(c.Id, c.Name, c.Description, c.ColorCode, c.Icon, c.CreatedAt));
    }

    public async Task<CategoryResponse?> GetByIdAsync(int id)
    {
        var c = await _repository.GetByIdAsync(id);
        return c == null ? null : new CategoryResponse(c.Id, c.Name, c.Description, c.ColorCode, c.Icon, c.CreatedAt);
    }

    public async Task<CategoryResponse> CreateAsync(CreateCategoryRequest request)
    {
        var category = new Category
        {
            Name = request.Name,
            Description = request.Description,
            ColorCode = request.ColorCode,
            Icon = request.Icon
        };

        await _repository.AddAsync(category);
        return new CategoryResponse(category.Id, category.Name, category.Description, category.ColorCode, category.Icon, category.CreatedAt);
    }

    public async Task UpdateAsync(int id, UpdateCategoryRequest request)
    {
        var category = await _repository.GetByIdAsync(id);
        if (category == null) throw new Exception("Category not found");

        category.Name = request.Name;
        category.Description = request.Description;
        category.ColorCode = request.ColorCode;
        category.Icon = request.Icon;

        await _repository.UpdateAsync(category);
    }

    public async Task DeleteAsync(int id)
    {
        await _repository.DeleteAsync(id);
    }
}

public class ExpenseService : IExpenseService
{
    private readonly IExpenseRepository _repository;

    public ExpenseService(IExpenseRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<ExpenseResponse>> GetUserExpensesAsync(int userId, DateTime? start = null, DateTime? end = null, int? categoryId = null)
    {
        var expenses = await _repository.GetByUserIdAsync(userId, start, end, categoryId);
        return expenses.Select(e => MapToResponse(e));
    }

    public async Task<ExpenseResponse?> GetByIdAsync(int id, int userId)
    {
        var e = await _repository.GetByIdAsync(id);
        if (e == null || e.UserId != userId) return null;
        return MapToResponse(e);
    }

    public async Task<ExpenseResponse> CreateAsync(int userId, CreateExpenseRequest request)
    {
        var expense = new Expense
        {
            UserId = userId,
            CategoryId = request.CategoryId,
            Description = request.Description,
            Value = request.Value,
            TransactionDate = request.TransactionDate,
            Observation = request.Observation,
            IsRecurrent = request.IsRecurrent
        };

        await _repository.AddAsync(expense);
        var created = await _repository.GetByIdAsync(expense.Id);
        return MapToResponse(created!);
    }

    public async Task UpdateAsync(int id, int userId, UpdateExpenseRequest request)
    {
        var expense = await _repository.GetByIdAsync(id);
        if (expense == null || expense.UserId != userId) throw new Exception("Expense not found");

        expense.CategoryId = request.CategoryId;
        expense.Description = request.Description;
        expense.Value = request.Value;
        expense.TransactionDate = request.TransactionDate;
        expense.Observation = request.Observation;
        expense.IsRecurrent = request.IsRecurrent;
        expense.Status = request.Status;

        await _repository.UpdateAsync(expense);
    }

    public async Task DeleteAsync(int id, int userId)
    {
        var expense = await _repository.GetByIdAsync(id);
        if (expense == null || expense.UserId != userId) return;
        await _repository.DeleteAsync(id);
    }

    private static ExpenseResponse MapToResponse(Expense e)
    {
        return new ExpenseResponse(
            e.Id,
            e.UserId,
            e.CategoryId,
            e.Category?.Name ?? "Sem Categoria",
            e.Description,
            e.Value,
            e.TransactionDate,
            e.Observation,
            e.IsRecurrent,
            e.Status,
            e.CreatedAt,
            e.UpdatedAt
        );
    }
}
