using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PIM_III_Backend.Application.Services;
using PIM_III_Backend.Domain.Constants;

namespace PIM_III_Backend.Infrastructure.Copilot;

public partial class RuleBasedCopilotClient : ICopilotAiClient
{

    public Task<CopilotReply> ReplyAsync(string userMessage, CopilotFinancialContext context)
    {
        var message = userMessage.Trim().ToLowerInvariant();
        var wantsExpense = message.Contains("gasto") || message.Contains("despesa");
        var wantsRegister = message.Contains("registrar") || message.Contains("lanca") || message.Contains("lancar");

        if (wantsRegister && wantsExpense)
            return Task.FromResult(BuildDraftReply(message, context));

        if (message.Contains("resumo") || (message.Contains("quanto") && (message.Contains("gast") || message.Contains("entr") || message.Contains("saldo"))))
            return Task.FromResult(new CopilotReply(
                $"Resumo do mes atual: entradas de R$ {context.MonthlyIncome:F2}, saidas de R$ {context.MonthlyExpense:F2} e saldo acumulado de R$ {context.Balance:F2}." +
                (context.MonthlyCeiling > 0
                    ? $" Suas saidas representam {Math.Round((double)(context.MonthlyExpense / context.MonthlyCeiling) * 100, 1)}% do seu teto geral de R$ {context.MonthlyCeiling:F2}."
                    : string.Empty),
                []));

        if (message.Contains("economiz") || message.Contains("cortar") || message.Contains("reduzir"))
        {
            if (context.OverBudgetCategories.Count > 0)
            {
                var worst = context.Categories.OrderByDescending(c => c.Percentage).First();
                var excess = Math.Round(worst.Spent - worst.Limit, 2);
                return Task.FromResult(new CopilotReply(
                    $"Atencao: {string.Join(", ", context.OverBudgetCategories)} esta(o) acima do teto neste mes. " +
                    $"{worst.Name} consumiu {worst.Percentage}% do limite (R$ {worst.Spent:F2} de R$ {worst.Limit:F2}). " +
                    $"Reduzindo cerca de R$ {Math.Max(excess, worst.Spent * 0.1m):F2} nele ate o fim do mes, voce volta ao plano. Quer que eu abra um novo orcamento para voce acompanhar?",
                    []));
            }
            if (context.Categories.Count > 0)
            {
                var highest = context.Categories.OrderByDescending(c => c.Spent).First();
                return Task.FromResult(new CopilotReply(
                    $"Sua maior area de gasto este mes e {highest.Name}: R$ {highest.Spent:F2} de R$ {highest.Limit:F2} ({highest.Percentage}% do teto). " +
                    "Pequenos cortes diarios nessa categoria costumam gerar a maior economia ao fim do mes.",
                    []));
            }
            return Task.FromResult(new CopilotReply(
                "Ainda nao encontrei gastos suficientes para sugerir cortes. Registre alguns lancamentos e volte a me perguntar onde economizar.",
                []));
        }

        return Task.FromResult(new CopilotReply(
            "Analisei seu historico e estou aqui para ajudar. Voce pode pedir um resumo do mes, perguntar onde economizar ou pedir para registrar um novo gasto.",
            []));
    }

    private static CopilotReply BuildDraftReply(string message, CopilotFinancialContext context)
    {
        var value = ExtractValue(message);
        var category = MatchCategory(message, context);
        var args = new Dictionary<string, object?> { ["type"] = "expense" };
        if (value.HasValue)
            args["value"] = value.Value;
        if (category is not null)
        {
            args["categoryName"] = category;
            args["description"] = $"Gasto com {category.ToLowerInvariant()}";
        }
        else
        {
            args["description"] = "Novo gasto";
        }
        return new CopilotReply(
            "Posso registrar esse gasto para voce. Revise os dados antes de confirmar:",
            [new CopilotAction("open_transaction_sheet", args)]);
    }

    private static decimal? ExtractValue(string message)
    {
        var currency = CurrencyRegex().Match(message);
        if (currency.Success)
            return decimal.Parse(currency.Groups[1].Value.Replace(',', '.'), System.Globalization.CultureInfo.InvariantCulture);
        var reais = ReaisRegex().Match(message);
        if (reais.Success)
            return decimal.Parse(reais.Groups[1].Value.Replace(',', '.'), System.Globalization.CultureInfo.InvariantCulture);
        return null;
    }

    private static string? MatchCategory(string message, CopilotFinancialContext context)
    {
        var matched = CategoryKeywords.Match(message);
        if (matched is not null)
            return matched;
        return context.Categories.FirstOrDefault(c => message.Contains(c.Name.ToLowerInvariant()))?.Name;
    }

    [GeneratedRegex(@"r\$\s*(\d+(?:[.,]\d{1,2})?)")]
    private static partial Regex CurrencyRegex();

    [GeneratedRegex(@"(\d+(?:[.,]\d{1,2})?)\s*(?:reais|real)")]
    private static partial Regex ReaisRegex();
}

public class LlmCopilotClient(
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration,
    ILogger<LlmCopilotClient> logger) : ICopilotAiClient
{
    public async Task<CopilotReply> ReplyAsync(string userMessage, CopilotFinancialContext context)
    {
        var baseUrl = configuration["Copilot:BaseUrl"]?.TrimEnd('/');
        var apiKey = configuration["Copilot:ApiKey"];
        var model = configuration["Copilot:Model"] ?? "gpt-4o-mini";
        if (string.IsNullOrWhiteSpace(baseUrl) || string.IsNullOrWhiteSpace(apiKey))
            throw new InvalidOperationException("Cliente de LLM nao configurado.");

        var systemPrompt =
            "Voce e o assistente financeiro do ConektaFinance, uma plataforma de financas pessoais. " +
            "Responda sempre em portugues do Brasil, de forma curta e objetiva. " +
            "Para abrir um rascunho de lancamento para o usuario confirmar, retorne a acao open_transaction_sheet com args type, value, description e categoryName. " +
            "Nunca contabilize valores por conta propria; use apenas o contexto fornecido. " +
            "Responda SOMENTE com JSON valido no formato {\"content\": string, \"actions\": []}. " +
            "Contexto financeiro do usuario: " + JsonSerializer.Serialize(context);

        var payload = JsonSerializer.Serialize(new
        {
            model,
            messages = new object[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userMessage }
            },
            temperature = 0.2
        });

        var client = httpClientFactory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/chat/completions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = new StringContent(payload, Encoding.UTF8, "application/json");

        using var response = await client.SendAsync(request);
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadAsStringAsync();
        var content = JsonDocument.Parse(body)
            .RootElement.GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();

        var cleaned = content?.Trim().Trim('`') ?? string.Empty;
        var jsonStart = cleaned.IndexOf('{');
        var jsonEnd = cleaned.LastIndexOf('}');
        if (jsonStart < 0 || jsonEnd <= jsonStart)
            throw new InvalidOperationException("Resposta do LLM fora do formato esperado.");
        var reply = JsonSerializer.Deserialize<CopilotReply>(cleaned[jsonStart..(jsonEnd + 1)],
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        if (reply is null || string.IsNullOrWhiteSpace(reply.Content))
            throw new InvalidOperationException("Resposta do LLM vazia.");
        return reply;
    }
}

public class CompositeCopilotClient(LlmCopilotClient? llm, RuleBasedCopilotClient ruleBased, ILogger<CompositeCopilotClient> logger) : ICopilotAiClient
{
    public async Task<CopilotReply> ReplyAsync(string userMessage, CopilotFinancialContext context)
    {
        if (llm is not null)
        {
            try
            {
                return await llm.ReplyAsync(userMessage, context);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Cliente de LLM falhou; usando fallback baseado em regras.");
            }
        }
        return await ruleBased.ReplyAsync(userMessage, context);
    }
}
