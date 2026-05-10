using Microsoft.EntityFrameworkCore;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Infrastructure.Persistence.Repositories;

public class BudgetRepository : IBudgetRepository
{
    private readonly AppDbContext _context;

    public BudgetRepository(AppDbContext context) => _context = context;

    public async Task<IEnumerable<Budget>> GetByUserIdAsync(int userId)
    {
        return await _context.Budgets
            .Include(x => x.Category)
            .Where(x => x.UserId == userId)
            .ToListAsync();
    }

    public async Task<Budget?> GetByUserAndCategoryAsync(int userId, int categoryId, int month, int year)
    {
        return await _context.Budgets
            .FirstOrDefaultAsync(x => x.UserId == userId && x.CategoryId == categoryId && x.PeriodMonth == month && x.PeriodYear == year);
    }

    public async Task AddAsync(Budget budget)
    {
        await _context.Budgets.AddAsync(budget);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Budget budget)
    {
        _context.Budgets.Update(budget);
        await _context.SaveChangesAsync();
    }
}

public class AlertRepository : IAlertRepository
{
    private readonly AppDbContext _context;

    public AlertRepository(AppDbContext context) => _context = context;

    public async Task<IEnumerable<Alert>> GetByUserIdAsync(int userId, bool? onlyUnread = null)
    {
        var query = _context.Alerts.Include(x => x.Category).Where(x => x.UserId == userId);
        if (onlyUnread.HasValue && onlyUnread.Value)
            query = query.Where(x => !x.IsRead);
        
        return await query.OrderByDescending(x => x.CreatedAt).ToListAsync();
    }

    public async Task<Alert?> GetByIdAsync(int id) => await _context.Alerts.FindAsync(id);

    public async Task AddAsync(Alert alert)
    {
        await _context.Alerts.AddAsync(alert);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Alert alert)
    {
        _context.Alerts.Update(alert);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var alert = await _context.Alerts.FindAsync(id);
        if (alert != null)
        {
            _context.Alerts.Remove(alert);
            await _context.SaveChangesAsync();
        }
    }
}
