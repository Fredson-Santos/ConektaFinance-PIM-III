namespace PIM_III_Backend.Application.Services;

public static class BudgetStatus
{
    public static string EvaluateStatus(decimal spent, decimal limit)
    {
        if (limit <= 0)
            return "noLimit";
        var percentage = (double)(spent / limit) * 100;
        if (percentage > 100)
            return "over";
        if (percentage >= 80)
            return "warn";
        return "ok";
    }

    public static double PercentageUsed(decimal spent, decimal limit) =>
        limit <= 0 ? 0 : (double)(spent / limit) * 100;
}
