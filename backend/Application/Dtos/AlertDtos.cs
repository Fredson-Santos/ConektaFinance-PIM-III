namespace PIM_III_Backend.Application.Dtos;

public record AlertCategoryBrief(int Id, string Name);

public record AlertResponse(
    int Id,
    string Type,
    string Title,
    string Message,
    AlertCategoryBrief? Category,
    bool IsRead,
    DateTime CreatedAt);

public record UnreadCountResponse(int Count);
