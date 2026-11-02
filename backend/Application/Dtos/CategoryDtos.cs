using PIM_III_Backend.Domain.Enums;

namespace PIM_III_Backend.Application.Dtos;

public record CategoryResponse(
    int Id,
    string Name,
    string? Description,
    string ColorCode,
    string Icon,
    CategoryKind Kind,
    int SortOrder,
    bool IsSystem,
    decimal? Spent,
    decimal? Limit,
    string? Status);

public record CreateCategoryRequest(string Name, string? Description, string ColorCode, string? Icon, CategoryKind Kind);

public record UpdateCategoryRequest(string? Name, string? Description, string? ColorCode, string? Icon, int? SortOrder);
