namespace PIM_III_Backend.Application.Dtos;

public record ImportPreviewItem(
    int Index,
    DateTime Date,
    string Description,
    decimal Amount,
    string Type,
    CategoryBrief? SuggestedCategory,
    bool IsDuplicate);

public record ImportPreviewResponse(
    int BatchId,
    string FileName,
    List<ImportPreviewItem> Items,
    bool AutoCategorize,
    bool IgnoreDuplicates);

public record ConfirmImportRequest(List<int> ItemIds, bool AutoCategorize, bool IgnoreDuplicates);

public record ImportResultResponse(int ImportedCount, int SkippedDuplicates);
