using PIM_III_Backend.Application.Dtos;

namespace PIM_III_Backend.Application.Services;

public interface IBudgetService
{
    Task<BudgetResponse> UpsertAsync(int userId, BudgetUpsertRequest request);
    Task<List<BudgetResponse>> ListAsync(int userId, int month, int year);
}
