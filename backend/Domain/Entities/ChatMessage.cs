namespace PIM_III_Backend.Domain.Entities;

public class ChatMessage
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    
    // "user" ou "assistant"
    public string Role { get; set; } = string.Empty;
    
    public string Content { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
