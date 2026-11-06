using ConektaFinance.Api.Application.Dtos;
using ConektaFinance.Api.Domain.Enums;

namespace ConektaFinance.Api.Application.Services;

public interface ICategoryService
{
    Task<List<CategoryResponse>> ListAsync(int userId, string? kind, int? month, int? year);
    Task<CategoryResponse> CreateAsync(int userId, CreateCategoryRequest request);
    Task<CategoryResponse> UpdateAsync(int userId, int categoryId, UpdateCategoryRequest request);
    Task DeleteAsync(int userId, int categoryId);
}
