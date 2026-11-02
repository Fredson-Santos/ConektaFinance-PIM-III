using PIM_III_Backend.Application.Dtos;

namespace PIM_III_Backend.Application.Services;

public record StatementRow(DateTime Date, string Description, decimal Amount);

public interface IStatementParser
{
    List<StatementRow> Parse(string fileName, Stream content);
}

public interface IImportService
{
    Task<ImportPreviewResponse> PreviewAsync(int userId, string fileName, Stream content, long length);
    Task<ImportResultResponse> ConfirmAsync(int userId, int batchId, ConfirmImportRequest request);
}
