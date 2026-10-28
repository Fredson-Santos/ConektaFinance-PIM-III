using PIM_III_Backend.Application.Dtos;

namespace PIM_III_Backend.Application.Services;

public interface IAdminService
{
    Task<AdminMetricsResponse> GetMetricsAsync();
    Task<AdminUserListResponse> ListUsersAsync(string? search, int page, int pageSize);
    Task<AdminUserResponse> UpdateStatusAsync(int adminId, int userId, bool isActive);
}
