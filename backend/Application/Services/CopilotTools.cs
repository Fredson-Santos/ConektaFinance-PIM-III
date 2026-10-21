using System.Globalization;
using System.Text;
using System.Text.Json;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Domain.Interfaces;
using PIM_III_Backend.Domain.Models;

namespace PIM_III_Backend.Application.Services;

/// <summary>
/// Definição de uma tool exposta ao LLM no formato OpenAI function calling.
/// </summary>
public record CopilotToolDefinition(string Name, string Description, string ParametersJsonSchema);

/// <summary>
/// Executa as tools do agente sempre em nome do usuário autenticado — o LLM
/// nunca informa o id do usuário, apenas argumentos escopados por tool.
/// </summary>
public interface ICopilotToolProvider
{
    IReadOnlyList<CopilotToolDefinition> Definitions { get; }

    Task<string> ExecuteAsync(int userId, string toolName, JsonElement args);

    Task<CopilotFinancialContext> BuildContextAsync(int userId, int month, int year);
}

public class CopilotToolProvider(
    ITransactionService transactionService,
    ITransactionRepository transactionRepository,
    IBudgetRepository budgetRepository,
    ICategoryService categoryService,
    IAlertService alertService,
    IUserRepository userRepository) : ICopilotToolProvider
{
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public IReadOnlyList<CopilotToolDefinition> Definitions { get; } =
    [
        new CopilotToolDefinition(
            "get_financial_summary",
            "Resumo financeiro de um mês: saldo acumulado, entradas, saídas e teto mensal do usuário.",
            """
            {"type":"object","properties":{"month":{"type":"integer","description":"Mês (1-12). Padrão: mês atual."},"year":{"type":"integer","description":"Ano com 4 dígitos. Padrão: ano atual."}},"required":[]}
            """),
        new CopilotToolDefinition(
            "get_category_breakdown",
            "Gastos por categoria em um mês, com teto, percentual consumido e status (ok/warn/over).",
            """
            {"type":"object","properties":{"month":{"type":"integer","description":"Mês (1-12). Padrão: mês atual."},"year":{"type":"integer","description":"Ano com 4 dígitos. Padrão: ano atual."}},"required":[]}
            """),
        new CopilotToolDefinition(
            "list_recent_transactions",
            "Lista transações recentes do usuário, com filtros opcionais de tipo e mês.",
            """
            {"type":"object","properties":{"limit":{"type":"integer","description":"Quantidade máxima (1-50). Padrão: 10."},"type":{"type":"string","enum":["expense","income"],"description":"Tipo de lançamento."},"month":{"type":"integer","description":"Mês (1-12). Sem padrão: todos."},"year":{"type":"integer"}},"required":[]}
            """),
        new CopilotToolDefinition(
            "list_budget_alerts",
            "Alertas de orçamento não lidos do usuário.",
            """
            {"type":"object","properties":{},"required":[]}
            """),
        new CopilotToolDefinition(
            "create_transaction",
            "Cria uma transação para o usuário. Use quando ele declarar explicitamente um gasto ou recebimento com valor claro (ex.: 'gastei 100 reais com ifood'). Grava direto no banco.",
            """
            {"type":"object","properties":{"type":{"type":"string","enum":["expense","income"],"description":"Tipo: expense para gasto, income para recebimento."},"description":{"type":"string","maxLength":120,"description":"Descrição curta do lançamento."},"value":{"type":"number","description":"Valor em reais, sempre positivo."},"categoryName":{"type":"string","description":"Nome de uma categoria existente do usuário."},"date":{"type":"string","format":"date","description":"Data do lançamento (yyyy-MM-dd). Padrão: hoje."}},"required":["type","description","value","categoryName"]}
            """),
        new CopilotToolDefinition(
            "draft_transaction",
            "Monta um rascunho de transação para o usuário confirmar no chat. NÃO grava no banco. Use quando os dados vierem de nota fiscal/imagem, forem ambíguos ou incompletos.",
            """
            {"type":"object","properties":{"type":{"type":"string","enum":["expense","income"]},"description":{"type":"string","maxLength":120},"value":{"type":"number","description":"Valor em reais, positivo."},"categoryName":{"type":"string","description":"Categoria sugerida (opcional)."}},"required":["type","description","value"]}
            """)
    ];

    public async Task<string> ExecuteAsync(int userId, string toolName, JsonElement args)
    {
        try
        {
            var result = toolName switch
            {
                "get_financial_summary" => await SummaryAsync(userId, args),
                "get_category_breakdown" => await BreakdownAsync(userId, args),
                "list_recent_transactions" => await RecentTransactionsAsync(userId, args),
                "list_budget_alerts" => await AlertsAsync(userId),
                "create_transaction" => await CreateTransactionAsync(userId, args),
                "draft_transaction" => await DraftTransactionAsync(userId, args),
                _ => (object)new { error = $"Tool desconhecida: {toolName}" }
            };
            return JsonSerializer.Serialize(result, Json);
        }
        catch (Exception ex) when (ex is not OutOfMemoryException)
        {
            // Tools nunca derrubam a conversa: o erro volta para o LLM
            // reagir pedindo correção ou esclarecimento ao usuário.
            return JsonSerializer.Serialize(new { error = ex.Message }, Json);
        }
    }

    public async Task<CopilotFinancialContext> BuildContextAsync(int userId, int month, int year)
    {
        var start = new DateTime(year, month, 1);
        var end = start.AddMonths(1);
        var allEnd = new DateTime(2100, 1, 1);

        var user = await userRepository.GetByIdAsync(userId);
        var income = await transactionRepository.SumAsync(userId, TransactionType.Income, start, end);
        var expense = await transactionRepository.SumAsync(userId, TransactionType.Expense, start, end);
        var allIncome = await transactionRepository.SumAsync(userId, TransactionType.Income, new DateTime(2000, 1, 1), allEnd);
        var allExpense = await transactionRepository.SumAsync(userId, TransactionType.Expense, new DateTime(2000, 1, 1), allEnd);

        var budgets = await budgetRepository.ListByPeriodAsync(userId, month, year);
        var spentByCategory = (await transactionRepository.SumByCategoryAsync(userId, TransactionType.Expense, start, end))
            .ToDictionary(s => s.CategoryId, s => s.Total);
        var categories = budgets
            .Where(b => b.Category.Kind == CategoryKind.Expense && b.LimitValue > 0)
            .Select(b =>
            {
                var spent = spentByCategory.GetValueOrDefault(b.CategoryId, 0m);
                return new CategoryBudgetSnapshot(
                    b.Category.Name,
                    spent,
                    b.LimitValue,
                    Math.Round(BudgetStatus.PercentageUsed(spent, b.LimitValue), 1),
                    BudgetStatus.EvaluateStatus(spent, b.LimitValue));
            })
            .ToList();

        return new CopilotFinancialContext(
            allIncome - allExpense,
            income,
            expense,
            user?.MonthlyCeiling ?? 0m,
            categories,
            categories.Where(c => c.Status == "over").Select(c => c.Name).ToList());
    }

    private async Task<object> SummaryAsync(int userId, JsonElement args)
    {
        var (month, year) = ParsePeriod(args);
        var context = await BuildContextAsync(userId, month, year);
        return new
        {
            month,
            year,
            context.Balance,
            context.MonthlyIncome,
            context.MonthlyExpense,
            context.MonthlyCeiling,
            monthSaving = context.MonthlyIncome - context.MonthlyExpense
        };
    }

    private async Task<object> BreakdownAsync(int userId, JsonElement args)
    {
        var (month, year) = ParsePeriod(args);
        var context = await BuildContextAsync(userId, month, year);
        return new
        {
            month,
            year,
            categories = context.Categories.Select(c => new
            {
                c.Name,
                c.Spent,
                c.Limit,
                c.Percentage,
                c.Status
            })
        };
    }

    private async Task<object> RecentTransactionsAsync(int userId, JsonElement args)
    {
        var limit = Math.Clamp(GetInt(args, "limit") ?? 10, 1, 50);
        TransactionType? type = null;
        if (GetString(args, "type") is { } t && Enum.TryParse<TransactionType>(t, true, out var parsed))
            type = parsed;
        int? month = GetInt(args, "month");
        int? year = GetInt(args, "year");

        var filter = new TransactionFilter
        {
            UserId = userId,
            Type = type,
            Page = 1,
            PageSize = limit
        };
        if (month is not null)
        {
            var y = year ?? DateTime.UtcNow.Year;
            var start = new DateTime(y, month.Value, 1);
            filter.Start = start;
            filter.End = start.AddMonths(1);
        }

        var list = await transactionService.ListAsync(filter);
        return new
        {
            total = list.Meta.TotalItems,
            items = list.Items.Select(t => new
            {
                t.Id,
                t.Type,
                t.Description,
                t.Value,
                t.TransactionDate,
                category = t.Category.Name
            })
        };
    }

    private async Task<object> AlertsAsync(int userId)
    {
        var alerts = await alertService.ListAsync(userId, unreadOnly: true);
        return new
        {
            count = alerts.Count,
            alerts = alerts.Select(a => new
            {
                a.Id,
                a.Title,
                a.Message,
                category = a.Category?.Name
            })
        };
    }

    private async Task<object> CreateTransactionAsync(int userId, JsonElement args)
    {
        var draft = await BuildDraftAsync(userId, args, requireCategory: true);
        var request = new CreateTransactionRequest(
            draft.Type,
            draft.CategoryId!.Value,
            draft.Description!,
            draft.Value,
            draft.Date,
            null,
            null,
            null);

        var created = await transactionService.CreateAsync(userId, request);

        try
        {
            await alertService.CheckBudgetAlertsAsync(userId, request.CategoryId, request.TransactionDate.Year, request.TransactionDate.Month);
        }
        catch
        {
            // Falha na checagem de alerta não pode desfazer o lançamento.
        }

        return new
        {
            success = true,
            transactionId = created.Id,
            created.Type,
            created.Description,
            created.Value,
            created.TransactionDate,
            category = created.Category.Name
        };
    }

    private async Task<object> DraftTransactionAsync(int userId, JsonElement args)
    {
        var draft = await BuildDraftAsync(userId, args, requireCategory: false);
        return new
        {
            success = true,
            draft = new
            {
                type = draft.Type.ToString().ToLowerInvariant(),
                draft.Description,
                draft.Value,
                categoryName = draft.CategoryName
            }
        };
    }

    private async Task<DraftPayload> BuildDraftAsync(int userId, JsonElement args, bool requireCategory)
    {
        var typeRaw = GetString(args, "type");
        if (!Enum.TryParse<TransactionType>(typeRaw, true, out var type))
            throw new InvalidOperationException("Tipo inválido: informe 'expense' ou 'income'.");

        var description = GetString(args, "description")?.Trim();
        if (string.IsNullOrWhiteSpace(description))
            throw new InvalidOperationException("Descrição do lançamento é obrigatória.");

        var value = GetDecimal(args, "value");
        if (value is null || value <= 0)
            throw new InvalidOperationException("Valor deve ser um número positivo em reais.");

        var dateRaw = GetString(args, "date");
        DateTime date = DateTime.UtcNow.Date;
        if (!string.IsNullOrWhiteSpace(dateRaw) &&
            !DateTime.TryParseExact(dateRaw, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out date))
            throw new InvalidOperationException("Data inválida: use o formato yyyy-MM-dd.");

        var categoryName = GetString(args, "categoryName")?.Trim();
        int? categoryId = null;
        if (!string.IsNullOrWhiteSpace(categoryName))
        {
            var category = await MatchCategoryAsync(userId, type, categoryName);
            if (category is null)
            {
                if (requireCategory)
                {
                    var available = await categoryService.ListAsync(userId, null, null, null);
                    throw new InvalidOperationException(
                        $"Categoria '{categoryName}' não encontrada. Disponíveis: {string.Join(", ", available.Select(c => c.Name))}.");
                }
            }
            else
            {
                categoryId = category.Id;
                categoryName = category.Name;
            }
        }
        else if (requireCategory)
        {
            var available = await categoryService.ListAsync(userId, null, null, null);
            throw new InvalidOperationException(
                $"Categoria obrigatória. Disponíveis: {string.Join(", ", available.Select(c => c.Name))}.");
        }

        return new DraftPayload(type, description, value.Value, date, categoryId, categoryName);
    }

    private async Task<CategoryResponse?> MatchCategoryAsync(int userId, TransactionType type, string name)
    {
        var kind = type == TransactionType.Income ? "income" : "expense";
        var categories = await categoryService.ListAsync(userId, kind, null, null);
        var wanted = Normalize(name);
        return categories.FirstOrDefault(c => Normalize(c.Name) == wanted)
            ?? categories.FirstOrDefault(c => Normalize(c.Name).Contains(wanted));
    }

    private static (int Month, int Year) ParsePeriod(JsonElement args)
    {
        var now = DateTime.UtcNow;
        var month = GetInt(args, "month") ?? now.Month;
        var year = GetInt(args, "year") ?? now.Year;
        if (month is < 1 or > 12)
            throw new InvalidOperationException("Mês inválido: use 1 a 12.");
        return (month, year);
    }

    private static string Normalize(string value) =>
        RemoveAccents(value.Trim().ToLowerInvariant());

    private static string RemoveAccents(string value)
    {
        var formD = value.Normalize(NormalizationForm.FormD);
        var chars = formD.Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark);
        return new string(chars.ToArray());
    }

    private static string? GetString(JsonElement args, string name) =>
        TryGetArg(args, name, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;

    private static int? GetInt(JsonElement args, string name)
    {
        if (!TryGetArg(args, name, out var value))
            return null;
        if (value.ValueKind == JsonValueKind.Number && value.TryGetInt32(out var number))
            return number;
        if (value.ValueKind == JsonValueKind.String && int.TryParse(value.GetString(), out var parsed))
            return parsed;
        return null;
    }

    private static decimal? GetDecimal(JsonElement args, string name)
    {
        if (!TryGetArg(args, name, out var value))
            return null;
        if (value.ValueKind == JsonValueKind.Number && value.TryGetDecimal(out var number))
            return number;
        if (value.ValueKind == JsonValueKind.String &&
            decimal.TryParse((value.GetString() ?? string.Empty).Replace(',', '.'), NumberStyles.Number, CultureInfo.InvariantCulture, out var parsed))
            return parsed;
        return null;
    }

    private static bool TryGetArg(JsonElement args, string name, out JsonElement value)
    {
        if (args.ValueKind == JsonValueKind.Object)
        {
            foreach (var property in args.EnumerateObject())
            {
                if (string.Equals(property.Name, name, StringComparison.OrdinalIgnoreCase))
                {
                    value = property.Value;
                    return true;
                }
            }
        }
        value = default;
        return false;
    }

    private record DraftPayload(
        TransactionType Type,
        string Description,
        decimal Value,
        DateTime Date,
        int? CategoryId,
        string? CategoryName);
}
