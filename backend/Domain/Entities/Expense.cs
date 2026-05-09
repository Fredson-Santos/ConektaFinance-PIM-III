using PIM_III_Backend.Domain.Enums;

namespace PIM_III_Backend.Domain.Entities;

public class Expense
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    public string Description { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public DateTime TransactionDate { get; set; }
    public string Observation { get; set; } = string.Empty;
    public bool IsRecurrent { get; set; }
    public ExpenseStatus Status { get; set; } = ExpenseStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
