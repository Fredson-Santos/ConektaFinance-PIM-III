using PIM_III_Backend.Domain.Enums;

namespace PIM_III_Backend.Application.Dtos.Alerts;

public record AlertResponse(
    int Id,
    string Type,
    string Title,
    string Message,
    int? CategoryId,
    string? CategoryName,
    bool IsRead,
    DateTime CreatedAt
);
