using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;

namespace PIM_III_Backend.Domain.Interfaces;

public interface IAlertRepository
{
    Task<List<Alert>> ListAsync(int userId, bool unreadOnly = false);
    Task<Alert?> GetByDedupKeyAsync(int userId, string dedupKey);
    Task<Alert?> GetByIdAndUserAsync(int id, int userId);
    Task<int> CountUnreadAsync(int userId);
    Task AddAsync(Alert alert);
    Task UpdateAsync(Alert alert);
    Task DeleteAsync(Alert alert);
    Task DeleteAllForUserAsync(int userId);
}

public interface IChatMessageRepository
{
    Task<List<ChatMessage>> ListRecentAsync(int userId, int take = 50);
    Task<ChatMessage?> GetByIdAndUserAsync(int id, int userId);
    Task<List<ChatMessage>> ListRecentWithActionsAsync(int userId, int take = 10);
    Task<int> CountSinceAsync(int userId, ChatRole role, DateTime since);
    Task AddAsync(ChatMessage message);
    Task UpdateAsync(ChatMessage message);
    Task ClearAsync(int userId);
}

public interface IOtpRepository
{
    Task<OtpCode?> GetLatestByPhoneAsync(string phone);
    Task AddAsync(OtpCode otp);
    Task UpdateAsync(OtpCode otp);
}

public interface IImportBatchRepository
{
    Task<ImportBatch?> GetByIdAndUserAsync(int id, int userId);
    Task AddAsync(ImportBatch batch);
    Task UpdateAsync(ImportBatch batch);
}
