using PIM_III_Backend.Application.Dtos.Expenses;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Application.Services;

public class ExpenseService : IExpenseService
{
    private readonly IExpenseRepository _repository;
    private readonly IBudgetRepository _budgetRepository;
    private readonly ICategoryRepository _categoryRepository;

    public ExpenseService(
        IExpenseRepository repository,
        IBudgetRepository budgetRepository,
        ICategoryRepository categoryRepository)
    {
        _repository = repository;
        _budgetRepository = budgetRepository;
        _categoryRepository = categoryRepository;
    }

    public async Task<IEnumerable<ExpenseResponse>> GetUserExpensesAsync(int userId, DateTime? start = null, DateTime? end = null, int? categoryId = null)
    {
        var expenses = await _repository.GetByUserIdAsync(userId, start, end, categoryId);

        return expenses
            .OrderByDescending(e => e.TransactionDate)
            .Select(MapToResponse);
    }

    public async Task<ExpenseResponse?> GetByIdAsync(int id, int userId)
    {
        var expense = await _repository.GetByIdAsync(id);

        if (expense == null || expense.UserId != userId)
            return null;

        return MapToResponse(expense);
    }

    public async Task<ExpenseResponse> CreateAsync(int userId, CreateExpenseRequest request)
    {
        // Validações
        if (request.Value <= 0)
            throw new ArgumentException("Valor deve ser maior que zero");

        if (request.TransactionDate > DateTime.UtcNow)
            throw new ArgumentException("Data não pode ser no futuro");

        var category = await _categoryRepository.GetByIdAsync(request.CategoryId);

        // BUG 2.4 CORRIGIDO: Validar se a categoria existe antes de criar a despesa.
        // Sem essa verificação, o EF Core lançaria uma FK violation → Erro 500.
        if (category == null)
            throw new ArgumentException($"Categoria com ID {request.CategoryId} não encontrada.");

        var expense = new Expense
        {
            UserId = userId,
            CategoryId = request.CategoryId,
            Category = category,
            Description = request.Description,
            Value = request.Value,
            TransactionDate = request.TransactionDate,
            Observation = request.Observation,
            IsRecurrent = request.IsRecurrent,
            Status = ExpenseStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };


        await _repository.AddAsync(expense);

        return MapToResponse(expense);
    }

    public async Task UpdateAsync(int id, int userId, UpdateExpenseRequest request)
    {
        var expense = await _repository.GetByIdAsync(id);

        if (expense == null || expense.UserId != userId)
            throw new Exception("Despesa não encontrada ou sem permissão");

        // Validações
        if (request.Value <= 0)
            throw new ArgumentException("Valor deve ser maior que zero");

        if (request.TransactionDate > DateTime.UtcNow)
            throw new ArgumentException("Data não pode ser no futuro");

        // Atualizar apenas campos fornecidos
        expense.CategoryId = request.CategoryId;
        expense.Description = request.Description;
        expense.Value = request.Value;
        expense.TransactionDate = request.TransactionDate;
        expense.Observation = request.Observation;
        expense.IsRecurrent = request.IsRecurrent;
        expense.Status = request.Status;
        expense.UpdatedAt = DateTime.UtcNow;

        await _repository.UpdateAsync(expense);
    }

    public async Task DeleteAsync(int id, int userId)
    {
        var expense = await _repository.GetByIdAsync(id);

        if (expense == null || expense.UserId != userId)
            throw new Exception("Despesa não encontrada ou sem permissão");

        await _repository.DeleteAsync(id);
    }

    private static ExpenseResponse MapToResponse(Expense expense)
    {
        return new ExpenseResponse(
            expense.Id,
            expense.UserId,
            expense.CategoryId,
            expense.Category?.Name ?? "Sem Categoria",
            expense.Description,
            expense.Value,
            expense.TransactionDate,
            expense.Observation,
            expense.IsRecurrent,
            expense.Status,
            expense.CreatedAt,
            expense.UpdatedAt
        );
    }
}
