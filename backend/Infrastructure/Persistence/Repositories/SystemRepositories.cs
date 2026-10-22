using Microsoft.EntityFrameworkCore;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Domain.Interfaces;
using PIM_III_Backend.Infrastructure.Persistence;

namespace PIM_III_Backend.Infrastructure.Persistence.Repositories;

public class AlertRepository(AppDbContext context) : IAlertRepository
{
    public Task<List<Alert>> ListAsync(int userId, bool unreadOnly = false)
    {
        var query = context.Alerts.AsNoTracking().Include(a => a.Category)
            .Where(a => a.UserId == userId);
        if (unreadOnly)
            query = query.Where(a => !a.IsRead);
        return query.OrderByDescending(a => a.CreatedAt).ToListAsync();
    }

    public Task<Alert?> GetByDedupKeyAsync(int userId, string dedupKey) =>
        context.Alerts.FirstOrDefaultAsync(a => a.UserId == userId && a.DedupKey == dedupKey);

    public Task<Alert?> GetByIdAndUserAsync(int id, int userId) =>
        context.Alerts.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

    public Task<int> CountUnreadAsync(int userId) =>
        context.Alerts.CountAsync(a => a.UserId == userId && !a.IsRead);

    public async Task AddAsync(Alert alert)
    {
        context.Alerts.Add(alert);
        await context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Alert alert)
    {
        alert.UpdatedAt = DateTime.UtcNow;
        context.Alerts.Update(alert);
        await context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Alert alert)
    {
        context.Alerts.Remove(alert);
        await context.SaveChangesAsync();
    }

    public async Task DeleteAllForUserAsync(int userId)
    {
        var alerts = context.Alerts.Where(a => a.UserId == userId);
        context.Alerts.RemoveRange(alerts);
        await context.SaveChangesAsync();
    }
}

public class ChatMessageRepository(AppDbContext context) : IChatMessageRepository
{
    public Task<List<ChatMessage>> ListRecentAsync(int userId, int take = 50) =>
        context.ChatMessages.AsNoTracking()
            .Where(m => m.UserId == userId)
            .OrderByDescending(m => m.Id)
            .Take(take)
            .ToListAsync();

    public Task<ChatMessage?> GetByIdAndUserAsync(int id, int userId) =>
        context.ChatMessages.FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);

    public Task<List<ChatMessage>> ListRecentWithActionsAsync(int userId, int take = 10) =>
        context.ChatMessages.AsNoTracking()
            .Where(m => m.UserId == userId && m.Role == ChatRole.Assistant && m.ActionPayload != null)
            .OrderByDescending(m => m.Id)
            .Take(take)
            .ToListAsync();

    public Task<int> CountSinceAsync(int userId, ChatRole role, DateTime since) =>
        context.ChatMessages.CountAsync(m => m.UserId == userId && m.Role == role && m.CreatedAt >= since);

    public async Task AddAsync(ChatMessage message)
    {
        context.ChatMessages.Add(message);
        await context.SaveChangesAsync();
    }

    public async Task UpdateAsync(ChatMessage message)
    {
        context.ChatMessages.Update(message);
        await context.SaveChangesAsync();
    }

    public async Task ClearAsync(int userId)
    {
        var messages = context.ChatMessages.Where(m => m.UserId == userId);
        context.ChatMessages.RemoveRange(messages);
        await context.SaveChangesAsync();
    }
}

public class OtpRepository(AppDbContext context) : IOtpRepository
{
    public Task<OtpCode?> GetLatestByPhoneAsync(string phone) =>
        context.OtpCodes.Where(o => o.Phone == phone)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync();

    public async Task AddAsync(OtpCode otp)
    {
        context.OtpCodes.Add(otp);
        await context.SaveChangesAsync();
    }

    public async Task UpdateAsync(OtpCode otp)
    {
        context.OtpCodes.Update(otp);
        await context.SaveChangesAsync();
    }
}

public class ImportBatchRepository(AppDbContext context) : IImportBatchRepository
{
    public Task<ImportBatch?> GetByIdAndUserAsync(int id, int userId) =>
        context.ImportBatches.FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);

    public async Task AddAsync(ImportBatch batch)
    {
        context.ImportBatches.Add(batch);
        await context.SaveChangesAsync();
    }

    public async Task UpdateAsync(ImportBatch batch)
    {
        context.ImportBatches.Update(batch);
        await context.SaveChangesAsync();
    }
}
