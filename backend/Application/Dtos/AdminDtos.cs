namespace PIM_III_Backend.Application.Dtos;

public record AdminMetricsResponse(
    int TotalUsers,
    int ActiveUsersLast30Days,
    int NewUsersThisMonth,
    int InactiveAccounts,
    int TransactionsThisMonth,
    int AlertsThisMonth,
    int AiMessagesWebThisMonth,
    int AiMessagesWhatsAppThisMonth);

public record AdminUserResponse(
    int Id,
    string FullName,
    string Email,
    string? Phone,
    string AccountType,
    bool IsActive,
    bool OnboardingCompleted,
    DateTime CreatedAt,
    int TransactionCount,
    DateTime? LastActivityAt);

public record AdminUserListResponse(List<AdminUserResponse> Items, int TotalItems, int Page, int PageSize);

public record UpdateUserStatusRequest(bool IsActive);
