using ConektaFinance.Api.Domain.Models;

namespace ConektaFinance.Api.Domain.Interfaces;

public interface IAdminRepository
{
    Task<AdminMetrics> GetMetricsAsync(DateTime now);
    Task<PagedResult<AdminUserSummary>> ListUsersAsync(string? search, int page, int pageSize);
    Task<AdminUserSummary?> GetUserAsync(int id);
}
