namespace PIM_III_Backend.Application.Dtos.Chat;

public record ChatMessageDto(
    int Id,
    string Role,
    string Content,
    DateTime CreatedAt
);

public record SendChatMessageRequest(
    string Content
);
