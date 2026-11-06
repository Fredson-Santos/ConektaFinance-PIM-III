using ConektaFinance.Api.Application.Dtos;

namespace ConektaFinance.Api.Application.Services;

public interface IBudgetService
{
    Task<BudgetResponse> UpsertAsync(int userId, BudgetUpsertRequest request);
    Task<List<BudgetResponse>> ListAsync(int userId, int month, int year);
}
