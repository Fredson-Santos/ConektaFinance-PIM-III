using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Domain.Interfaces;
using PIM_III_Backend.Domain.Models;

namespace PIM_III_Backend.Infrastructure.Persistence.Repositories;

public class AdminRepository(AppDbContext context) : IAdminRepository
{
    private static readonly Expression<Func<User, AdminUserSummary>> ToSummary = u => new AdminUserSummary(
        u.Id,
        u.FullName,
        u.Email,
        u.Phone,
        u.AccountType,
        u.IsActive,
        u.OnboardingCompletedAt != null,
        u.CreatedAt,
        u.Transactions.Count,
        u.Transactions.Max(t => (DateTime?)t.CreatedAt));

    public async Task<AdminMetrics> GetMetricsAsync(DateTime now)
    {
        var monthStart = new DateTime(now.Year, now.Month, 1);
        var activitySince = now.AddDays(-30);

        var activeUsers = await context.Transactions
            .Where(t => t.CreatedAt >= activitySince).Select(t => t.UserId)
            .Union(context.ChatMessages
                .Where(m => m.Role == ChatRole.User && m.CreatedAt >= activitySince).Select(m => m.UserId))
            .Distinct()
            .CountAsync();

        var aiMessages = await context.ChatMessages
            .Where(m => m.Role == ChatRole.User && m.CreatedAt >= monthStart)
            .GroupBy(m => m.Channel)
            .Select(g => new { Channel = g.Key, Count = g.Count() })
            .ToListAsync();

        return new AdminMetrics(
            await context.Users.CountAsync(),
            activeUsers,
            await context.Users.CountAsync(u => u.CreatedAt >= monthStart),
            await context.Users.CountAsync(u => !u.IsActive),
            await context.Transactions.CountAsync(t => t.CreatedAt >= monthStart),
            await context.Alerts.CountAsync(a => a.CreatedAt >= monthStart),
            aiMessages.Where(a => a.Channel == ChatChannel.Web).Sum(a => a.Count),
            aiMessages.Where(a => a.Channel == ChatChannel.WhatsApp).Sum(a => a.Count));
    }

    public async Task<PagedResult<AdminUserSummary>> ListUsersAsync(string? search, int page, int pageSize)
    {
        var query = context.Users.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var pattern = $"%{search.Trim()}%";
            query = query.Where(u => EF.Functions.ILike(u.FullName, pattern) ||
                                     EF.Functions.ILike(u.Email, pattern) ||
                                     (u.Phone != null && EF.Functions.ILike(u.Phone, pattern)));
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(u => u.CreatedAt)
            .ThenByDescending(u => u.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(ToSummary)
            .ToListAsync();
        return new PagedResult<AdminUserSummary>(items, total, page, pageSize);
    }

    public Task<AdminUserSummary?> GetUserAsync(int id) =>
        context.Users.AsNoTracking().Where(u => u.Id == id).Select(ToSummary).FirstOrDefaultAsync();
}
