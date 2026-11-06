using ConektaFinance.Api.Application.Dtos;

namespace ConektaFinance.Api.Application.Services;

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
