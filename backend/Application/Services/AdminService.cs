using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Exceptions;
using PIM_III_Backend.Domain.Interfaces;
using PIM_III_Backend.Domain.Models;

namespace PIM_III_Backend.Application.Services;

public class AdminService(IAdminRepository adminRepository, IUserRepository userRepository) : IAdminService
{
    private const int MaxPageSize = 100;

    public async Task<AdminMetricsResponse> GetMetricsAsync()
    {
        var metrics = await adminRepository.GetMetricsAsync(DateTime.UtcNow);
        return new AdminMetricsResponse(
            metrics.TotalUsers,
            metrics.ActiveUsersLast30Days,
            metrics.NewUsersThisMonth,
            metrics.InactiveAccounts,
            metrics.TransactionsThisMonth,
            metrics.AlertsThisMonth,
            metrics.AiMessagesWebThisMonth,
            metrics.AiMessagesWhatsAppThisMonth);
    }

    public async Task<AdminUserListResponse> ListUsersAsync(string? search, int page, int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);
        var result = await adminRepository.ListUsersAsync(search, page, pageSize);
        return new AdminUserListResponse(result.Items.Select(Map).ToList(), result.TotalItems, result.Page, result.PageSize);
    }

    public async Task<AdminUserResponse> UpdateStatusAsync(int adminId, int userId, bool isActive)
    {
        if (adminId == userId)
            throw AppException.BadRequest("Operacao nao permitida", "O administrador nao pode alterar o status da propria conta.");

        var user = await userRepository.GetByIdAsync(userId)
            ?? throw AppException.NotFound("Usuario nao encontrado", "Verifique o identificador informado.");
        user.IsActive = isActive;
        await userRepository.UpdateAsync(user);

        return Map((await adminRepository.GetUserAsync(user.Id))!);
    }

    private static AdminUserResponse Map(AdminUserSummary user) => new(
        user.Id,
        user.FullName,
        user.Email,
        user.Phone,
        user.AccountType,
        user.IsActive,
        user.OnboardingCompleted,
        user.CreatedAt,
        user.TransactionCount,
        user.LastActivityAt);
}
