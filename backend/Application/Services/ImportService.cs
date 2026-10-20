using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Exceptions;
using PIM_III_Backend.Domain.Constants;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Application.Services;

public class ImportService(
    IImportBatchRepository importBatchRepository,
    ITransactionRepository transactionRepository,
    ICategoryRepository categoryRepository,
    IStatementParser statementParser) : IImportService
{
    private const long MaxFileBytes = 5 * 1024 * 1024;

    public async Task<ImportPreviewResponse> PreviewAsync(int userId, string fileName, Stream content, long length)
    {
        if (length <= 0 || length > MaxFileBytes)
            throw AppException.BadRequest("Arquivo invalido", "Envie um extrato de ate 5MB.");

        var rows = statementParser.Parse(fileName, content);
        if (rows.Count == 0)
            throw AppException.BadRequest("Nenhum lancamento detectado",
                "Verifique se o arquivo contem as colunas Data, Descricao e Valor.");

        var categories = await categoryRepository.ListAsync(userId);
        var expenseCategories = categories.Where(c => c.Kind == CategoryKind.Expense).ToList();
        var incomeCategories = categories.Where(c => c.Kind == CategoryKind.Income).ToList();

        var items = new List<ImportPreviewItem>();
        foreach (var (row, index) in rows.Select((row, index) => (row, index)))
        {
            var type = row.Amount < 0 ? TransactionType.Expense : TransactionType.Income;
            var amount = Math.Abs(row.Amount);
            if (amount == 0)
                continue;
            var suggestedName = CategoryKeywords.Match(row.Description);
            var suggested = suggestedName is null
                ? null
                : (type == TransactionType.Expense
                    ? expenseCategories.FirstOrDefault(c => c.Name.Equals(suggestedName, StringComparison.OrdinalIgnoreCase))
                    : incomeCategories.FirstOrDefault(c => c.Name.Equals(suggestedName, StringComparison.OrdinalIgnoreCase)))
                  ?? expenseCategories.FirstOrDefault(c => c.Name == "Outros")
                  ?? incomeCategories.FirstOrDefault(c => c.Name == "Outras entradas");
            var externalId = BuildExternalId(userId, row);
            var isDuplicate = await transactionRepository.ExistsExternalAsync(userId, externalId);
            items.Add(new ImportPreviewItem(index, row.Date, row.Description, amount,
                type == TransactionType.Expense ? "expense" : "income",
                suggested is null ? null : new CategoryBrief(suggested.Id, suggested.Name, suggested.ColorCode, suggested.Icon),
                isDuplicate));
        }

        var batch = new ImportBatch
        {
            UserId = userId,
            FileName = Path.GetFileName(fileName),
            DetectedCount = items.Count,
            ItemsJson = JsonSerializer.Serialize(items)
        };
        await importBatchRepository.AddAsync(batch);

        return new ImportPreviewResponse(batch.Id, batch.FileName, items, true, true);
    }

    public async Task<ImportResultResponse> ConfirmAsync(int userId, int batchId, ConfirmImportRequest request)
    {
        var batch = await importBatchRepository.GetByIdAndUserAsync(batchId, userId)
            ?? throw AppException.NotFound("Importacao nao encontrada", "O lote pode ter expirado. Gere a previa novamente.");
        if (batch.Status != ImportStatus.Pending)
            throw AppException.Conflict("Importacao ja concluida", "Este lote ja foi processado.");

        var items = JsonSerializer.Deserialize<List<ImportPreviewItem>>(batch.ItemsJson)
            ?? throw AppException.BadRequest("Previa invalida", "Gere a previa novamente.");

        var categories = await categoryRepository.ListAsync(userId);
        var imported = 0;
        var skipped = 0;

        foreach (var item in items.Where(i => request.ItemIds.Contains(i.Index)))
        {
            var externalId = BuildExternalId(userId, new StatementRow(item.Date, item.Description, item.Amount));
            var alreadyRegistered = await transactionRepository.ExistsExternalAsync(userId, externalId);
            if (alreadyRegistered && request.IgnoreDuplicates)
            {
                skipped++;
                continue;
            }

            var type = item.Type == "expense" ? TransactionType.Expense : TransactionType.Income;
            var category = ResolveCategory(categories, type, request.AutoCategorize ? item.SuggestedCategory?.Name : null);

            var transaction = new Transaction
            {
                UserId = userId,
                CategoryId = category.Id,
                Type = type,
                Description = item.Description,
                Value = item.Amount,
                TransactionDate = DateTime.SpecifyKind(item.Date.Date, DateTimeKind.Utc),
                PaymentMethod = Domain.Enums.PaymentMethod.Outro,
                Source = TransactionSource.Import,
                ImportBatchId = batch.Id,
                ExternalId = alreadyRegistered ? null : externalId
            };
            await transactionRepository.AddAsync(transaction);
            imported++;
        }

        batch.ImportedCount = imported;
        batch.SkippedDuplicates = skipped;
        batch.AutoCategorize = request.AutoCategorize;
        batch.IgnoreDuplicates = request.IgnoreDuplicates;
        batch.Status = ImportStatus.Confirmed;
        await importBatchRepository.UpdateAsync(batch);

        return new ImportResultResponse(imported, skipped);
    }

    private static Domain.Entities.Category ResolveCategory(List<Domain.Entities.Category> categories, TransactionType type, string? suggestedName)
    {
        var kind = type == TransactionType.Expense ? CategoryKind.Expense : CategoryKind.Income;
        if (!string.IsNullOrWhiteSpace(suggestedName))
        {
            var suggested = categories.FirstOrDefault(c =>
                c.Kind == kind && c.Name.Equals(suggestedName, StringComparison.OrdinalIgnoreCase));
            if (suggested is not null)
                return suggested;
        }
        var fallbackName = type == TransactionType.Expense ? "Outros" : "Outras entradas";
        return categories.FirstOrDefault(c => c.Kind == kind && c.Name == fallbackName)
            ?? categories.First(c => c.Kind == kind);
    }

    private static string BuildExternalId(int userId, StatementRow row) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(
            $"{userId}|{row.Date:yyyyMMdd}|{row.Description.Trim().ToLowerInvariant()}|{Math.Abs(row.Amount):F2}")));
}
