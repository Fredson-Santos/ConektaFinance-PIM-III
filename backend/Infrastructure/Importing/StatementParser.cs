using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using ClosedXML.Excel;
using PIM_III_Backend.Application.Exceptions;
using PIM_III_Backend.Application.Services;

namespace PIM_III_Backend.Infrastructure.Importing;

public partial class StatementParser : IStatementParser
{
    private const int MaxRows = 200;

    public List<StatementRow> Parse(string fileName, Stream content)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        var rows = extension switch
        {
            ".csv" => ParseCsv(content),
            ".ofx" => ParseOfx(content),
            ".xlsx" => ParseXlsx(content),
            _ => throw AppException.BadRequest("Formato nao suportado",
                "Envie um extrato em CSV, OFX ou XLSX (converta XLS antigo para XLSX).")
        };
        return rows.Take(MaxRows).ToList();
    }

    private static List<StatementRow> ParseCsv(Stream content)
    {
        using var reader = new StreamReader(content, Encoding.UTF8, leaveOpen: true);
        var lines = new List<string>();
        while (reader.ReadLine() is { } line && !string.IsNullOrWhiteSpace(line))
            lines.Add(line);
        if (lines.Count < 2)
            return [];

        var separator = DetectSeparator(lines[0]);
        var headers = lines[0].Split(separator).Select(NormalizeHeader).ToList();
        var dateIndex = FindIndex(headers, "data", "date", "dt");
        var descriptionIndex = FindIndex(headers, "descricao", "historico", "memo", "detalhe");
        var amountIndex = FindIndex(headers, "valor", "amount", "montante");
        if (dateIndex < 0 || descriptionIndex < 0 || amountIndex < 0)
            throw AppException.BadRequest("Cabecalho invalido",
                "O arquivo precisa das colunas Data, Descricao e Valor.");

        var rows = new List<StatementRow>();
        foreach (var line in lines.Skip(1))
        {
            var parts = line.Split(separator);
            if (parts.Length <= Math.Max(dateIndex, Math.Max(descriptionIndex, amountIndex)))
                continue;
            if (!TryParseDate(parts[dateIndex].Trim().Trim('"'), out var date) ||
                !TryParseAmount(parts[amountIndex].Trim().Trim('"'), out var amount))
                continue;
            rows.Add(new StatementRow(date, parts[descriptionIndex].Trim().Trim('"'), amount));
        }
        return rows;
    }

    private static List<StatementRow> ParseOfx(Stream content)
    {
        using var reader = new StreamReader(content, Encoding.Latin1, leaveOpen: true);
        var text = reader.ReadToEnd();
        var rows = new List<StatementRow>();
        foreach (var block in text.Split("<STMTTRN>", StringSplitOptions.RemoveEmptyEntries))
        {
            var posted = PostedRegex().Match(block);
            var amount = AmountRegex().Match(block);
            var memo = MemoRegex().Match(block);
            if (!posted.Success || !amount.Success)
                continue;
            if (!DateTime.TryParseExact(posted.Groups[1].Value[..8], "yyyyMMdd",
                    CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
                continue;
            if (!TryParseAmount(amount.Groups[1].Value, out var value))
                continue;
            var description = memo.Success ? memo.Groups[1].Value.Trim() : "Lancamento importado";
            rows.Add(new StatementRow(date, description, value));
        }
        return rows;
    }

    private static List<StatementRow> ParseXlsx(Stream content)
    {
        using var workbook = new XLWorkbook(content);
        var worksheet = workbook.Worksheets.First();
        var headerRow = worksheet.FirstRow();
        if (headerRow is null)
            return [];

        var headers = headerRow.CellsUsed().ToDictionary(c => NormalizeHeader(c.GetString()), c => c.Address.ColumnNumber);
        var dateColumn = FindColumn(headers, "data", "date", "dt");
        var descriptionColumn = FindColumn(headers, "descricao", "historico", "memo", "detalhe");
        var amountColumn = FindColumn(headers, "valor", "amount", "montante");
        if (dateColumn is null || descriptionColumn is null || amountColumn is null)
            throw AppException.BadRequest("Cabecalho invalido",
                "A planilha precisa das colunas Data, Descricao e Valor.");

        var rows = new List<StatementRow>();
        foreach (var row in worksheet.RowsUsed().Skip(1))
        {
            var dateCell = row.Cell(dateColumn.Value);
            var amountCell = row.Cell(amountColumn.Value);
            var date = dateCell.DataType == XLDataType.DateTime
                ? dateCell.GetDateTime().Date
                : TryParseDate(dateCell.GetString().Trim(), out var parsed) ? parsed : (DateTime?)null;
            if (date is null)
                continue;
            if (!TryParseAmount(amountCell.GetString().Trim(), out var amount))
                continue;
            rows.Add(new StatementRow(date.Value, row.Cell(descriptionColumn.Value).GetString().Trim(), amount));
        }
        return rows;
    }

    private static char DetectSeparator(string header) =>
        header.Count(';') >= header.Count(',') ? ';' : ',';

    private static string NormalizeHeader(string value) =>
        value.Trim().Trim('"').ToLowerInvariant().Normalize(NormalizationForm.FormD)
            .Replace("\u0301", "").Replace("\u0303", "").Replace("\u0302", "").Replace("\u030c", "");

    private static int FindIndex(List<string> headers, params string[] names)
    {
        for (var i = 0; i < headers.Count; i++)
        {
            if (names.Any(n => headers[i].Contains(n)))
                return i;
        }
        return -1;
    }

    private static int? FindColumn(Dictionary<string, int> headers, params string[] names)
    {
        foreach (var (header, column) in headers)
        {
            if (names.Any(n => header.Contains(n)))
                return column;
        }
        return null;
    }

    private static bool TryParseDate(string value, out DateTime date)
    {
        var formats = new[] { "dd/MM/yyyy", "yyyy-MM-dd", "dd/MM/yy", "d/M/yyyy" };
        if (DateTime.TryParseExact(value, formats, new CultureInfo("pt-BR"), DateTimeStyles.None, out date))
            return true;
        return DateTime.TryParse(value, new CultureInfo("pt-BR"), DateTimeStyles.None, out date);
    }

    private static bool TryParseAmount(string value, out decimal amount)
    {
        var cleaned = value.Replace("R$", "", StringComparison.OrdinalIgnoreCase)
            .Replace(" ", "", StringComparison.Ordinal)
            .Replace(".", "", StringComparison.Ordinal)
            .Replace(",", ".", StringComparison.Ordinal)
            .Trim();
        if (string.IsNullOrEmpty(cleaned))
        {
            amount = 0;
            return false;
        }
        return decimal.TryParse(cleaned, NumberStyles.Number, CultureInfo.InvariantCulture, out amount);
    }

    [GeneratedRegex(@"DTPOSTED>(\d{8})")]
    private static partial Regex PostedRegex();

    [GeneratedRegex(@"TRNAMT>([-+]?[\d.,]+)")]
    private static partial Regex AmountRegex();

    [GeneratedRegex(@"MEMO>([^<\r\n]+)")]
    private static partial Regex MemoRegex();
}
