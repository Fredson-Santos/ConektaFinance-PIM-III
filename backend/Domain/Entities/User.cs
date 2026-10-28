namespace PIM_III_Backend.Domain.Entities;

public class User
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Cpf { get; set; }
    public string? Occupation { get; set; }
    public string? AvatarUrl { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public string AccountType { get; set; } = "Standard";
    public decimal MonthlyCeiling { get; set; }
    public string Currency { get; set; } = "BRL";
    public int CycleStartDay { get; set; } = 1;
    public DateTime? OnboardingCompletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Category> Categories { get; set; } = new List<Category>();
    public ICollection<Budget> Budgets { get; set; } = new List<Budget>();
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    public ICollection<Alert> Alerts { get; set; } = new List<Alert>();
    public ICollection<ChatMessage> ChatMessages { get; set; } = new List<ChatMessage>();
    public ICollection<OtpCode> OtpCodes { get; set; } = new List<OtpCode>();
    public ICollection<ImportBatch> ImportBatches { get; set; } = new List<ImportBatch>();
}
