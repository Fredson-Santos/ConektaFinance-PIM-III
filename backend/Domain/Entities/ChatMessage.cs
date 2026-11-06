using ConektaFinance.Api.Domain.Enums;

namespace ConektaFinance.Api.Domain.Entities;

public class ChatMessage
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public ChatRole Role { get; set; } = ChatRole.User;
    public ChatChannel Channel { get; set; } = ChatChannel.Web;
    public string Content { get; set; } = string.Empty;
    public string? ActionPayload { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
