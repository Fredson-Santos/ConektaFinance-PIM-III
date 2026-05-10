namespace PIM_III_Backend.Application.Dtos.Categories;

public record CategoryResponse(
    int Id,
    string Name,
    string Description,
    string ColorCode,
    string Icon,
    DateTime CreatedAt
);
