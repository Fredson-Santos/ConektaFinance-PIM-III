namespace PIM_III_Backend.Application.Dtos.Categories;

public record CreateCategoryRequest(
    string Name,
    string Description,
    string ColorCode,
    string Icon
);

public record UpdateCategoryRequest(
    string Name,
    string Description,
    string ColorCode,
    string Icon
);
