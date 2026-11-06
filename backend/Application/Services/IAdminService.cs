using ConektaFinance.Api.Application.Dtos;

namespace ConektaFinance.Api.Application.Services;

public interface IAdminService
{
    Task<AdminMetricsResponse> GetMetricsAsync();
    Task<AdminUserListResponse> ListUsersAsync(string? search, int page, int pageSize);
    Task<AdminUserResponse> UpdateStatusAsync(int adminId, int userId, bool isActive);
}
