using PIM_III_Backend.Application.Dtos.Insights;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Application.Services;

public class InsightService : IInsightService
{
    private readonly IExpenseRepository _expenseRepository;

    public InsightService(IExpenseRepository expenseRepository)
    {
        _expenseRepository = expenseRepository;
    }

    public async Task<IEnumerable<InsightResponse>> GetInsightsAsync(int userId)
    {
        var expenses = await _expenseRepository.GetByUserIdAsync(userId);
        var insights = new List<InsightResponse>();

        if (!expenses.Any()) return insights;

        var total = expenses.Sum(x => x.Value);
        var avg = total / 30; // Média diária aproximada

        if (total > 1000)
        {
            insights.Add(new InsightResponse(
                "Gastos Elevados",
                "Seus gastos mensais ultrapassaram R$ 1.000,00.",
                "Tente revisar assinaturas e gastos fixos para economizar.",
                "Warning"
            ));
        }

        var topCategory = expenses.GroupBy(x => x.Category.Name)
            .OrderByDescending(g => g.Sum(x => x.Value))
            .FirstOrDefault();

        if (topCategory != null)
        {
            insights.Add(new InsightResponse(
                "Maior Gasto: " + topCategory.Key,
                $"A categoria {topCategory.Key} representa a maior parte dos seus gastos.",
                "Considere definir um limite de orçamento para esta categoria.",
                "Info"
            ));
        }

        return insights;
    }
}
