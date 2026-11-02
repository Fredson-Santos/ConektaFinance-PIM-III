using PIM_III_Backend.Domain.Enums;

namespace PIM_III_Backend.Domain.Entities;

public class Transaction
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    public TransactionType Type { get; set; } = TransactionType.Expense;
    public string Description { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public DateTime TransactionDate { get; set; }
    public PaymentMethod? PaymentMethod { get; set; }
    public string? Observation { get; set; }
    public bool IsRecurrent { get; set; }
    public TransactionStatus Status { get; set; } = TransactionStatus.Active;
    public TransactionSource Source { get; set; } = TransactionSource.Manual;
    public int? ImportBatchId { get; set; }
    public ImportBatch? ImportBatch { get; set; }
    public string? ExternalId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
