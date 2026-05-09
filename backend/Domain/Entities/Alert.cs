using PIM_III_Backend.Domain.Enums;

namespace PIM_III_Backend.Domain.Entities;

public class Alert
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public AlertType Type { get; set; }
    public string Message { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public Category? Category { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
