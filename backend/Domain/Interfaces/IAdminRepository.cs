using PIM_III_Backend.Domain.Models;

namespace PIM_III_Backend.Domain.Interfaces;

public interface IAdminRepository
{
    Task<AdminMetrics> GetMetricsAsync(DateTime now);
    Task<PagedResult<AdminUserSummary>> ListUsersAsync(string? search, int page, int pageSize);
    Task<AdminUserSummary?> GetUserAsync(int id);
}
