namespace PIM_III_Backend.Domain.Models;

public record AdminMetrics(
    int TotalUsers,
    int ActiveUsersLast30Days,
    int NewUsersThisMonth,
    int InactiveAccounts,
    int TransactionsThisMonth,
    int AlertsThisMonth,
    int AiMessagesWebThisMonth,
    int AiMessagesWhatsAppThisMonth);

public record AdminUserSummary(
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
