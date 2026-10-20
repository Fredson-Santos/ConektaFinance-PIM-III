using Microsoft.EntityFrameworkCore;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Domain.Interfaces;
using PIM_III_Backend.Domain.Models;
using PIM_III_Backend.Infrastructure.Persistence;

namespace PIM_III_Backend.Infrastructure.Persistence.Repositories;

public class UserRepository(AppDbContext context) : IUserRepository
{
    public Task<User?> GetByIdAsync(int id) =>
        context.Users.FirstOrDefaultAsync(u => u.Id == id);

    public Task<User?> GetByEmailAsync(string email) =>
        context.Users.FirstOrDefaultAsync(u => u.Email == email);

    public Task<User?> GetByPhoneAsync(string phone) =>
        context.Users.FirstOrDefaultAsync(u => u.Phone == phone);

    public async Task AddAsync(User user)
    {
        context.Users.Add(user);
        await context.SaveChangesAsync();
    }

    public async Task UpdateAsync(User user)
    {
        user.UpdatedAt = DateTime.UtcNow;
        context.Users.Update(user);
        await context.SaveChangesAsync();
    }

    public async Task DeleteAsync(User user)
    {
        context.Users.Remove(user);
        await context.SaveChangesAsync();
    }
}

public class CategoryRepository(AppDbContext context) : ICategoryRepository
{
    public Task<List<Category>> ListAsync(int userId, CategoryKind? kind = null)
    {
        var query = context.Categories.AsNoTracking().Where(c => c.UserId == userId);
        if (kind.HasValue)
            query = query.Where(c => c.Kind == kind.Value);
        return query.OrderBy(c => c.SortOrder).ThenBy(c => c.Name).ToListAsync();
    }

    public Task<Category?> GetByIdAsync(int id) =>
        context.Categories.FirstOrDefaultAsync(c => c.Id == id);

    public Task<Category?> GetByIdAndUserAsync(int id, int userId) =>
        context.Categories.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

    public Task<bool> ExistsNameAsync(int userId, string name, int? excludeId = null)
    {
        var query = context.Categories.Where(c => c.UserId == userId && c.Name == name);
        if (excludeId.HasValue)
            query = query.Where(c => c.Id != excludeId.Value);
        return query.AnyAsync();
    }

    public Task<int> CountTransactionsAsync(int categoryId) =>
        context.Transactions.CountAsync(t => t.CategoryId == categoryId);

    public async Task AddAsync(Category category)
    {
        context.Categories.Add(category);
        await context.SaveChangesAsync();
    }

    public async Task AddRangeAsync(IEnumerable<Category> categories)
    {
        context.Categories.AddRange(categories);
        await context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Category category)
    {
        category.UpdatedAt = DateTime.UtcNow;
        context.Categories.Update(category);
        await context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Category category)
    {
        context.Categories.Remove(category);
        await context.SaveChangesAsync();
    }
}

public class BudgetRepository(AppDbContext context) : IBudgetRepository
{
    public Task<List<Budget>> ListByPeriodAsync(int userId, int month, int year) =>
        context.Budgets.AsNoTracking()
            .Include(b => b.Category)
            .Where(b => b.UserId == userId && b.PeriodMonth == month && b.PeriodYear == year)
            .ToListAsync();

    public Task<Budget?> GetAsync(int userId, int categoryId, int month, int year) =>
        context.Budgets.FirstOrDefaultAsync(b =>
            b.UserId == userId && b.CategoryId == categoryId && b.PeriodMonth == month && b.PeriodYear == year);

    public async Task AddAsync(Budget budget)
    {
        context.Budgets.Add(budget);
        await context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Budget budget)
    {
        budget.UpdatedAt = DateTime.UtcNow;
        context.Budgets.Update(budget);
        await context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Budget budget)
    {
        context.Budgets.Remove(budget);
        await context.SaveChangesAsync();
    }

    public async Task DeleteAllForUserAsync(int userId)
    {
        var budgets = context.Budgets.Where(b => b.UserId == userId);
        context.Budgets.RemoveRange(budgets);
        await context.SaveChangesAsync();
    }
}
