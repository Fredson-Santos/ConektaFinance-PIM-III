using PIM_III_Backend.Domain.Enums;

namespace PIM_III_Backend.Domain.Entities;

public class ChatMessage
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public ChatRole Role { get; set; } = ChatRole.User;
    public string Content { get; set; } = string.Empty;
    public string? ActionPayload { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
