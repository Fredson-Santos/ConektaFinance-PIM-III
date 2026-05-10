namespace PIM_III_Backend.Application.Dtos.Insights;

public record InsightResponse(
    string Title,
    string Description,
    string Suggestion,
    string Severity // "Info", "Warning", "Critical"
);
