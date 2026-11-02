namespace PIM_III_Backend.Domain.Constants;

public static class CategoryKeywords
{
    public static readonly Dictionary<string, string> Map = new()
    {
        ["ifood"] = "Alimentação",
        ["mercado"] = "Alimentação",
        ["supermercado"] = "Alimentação",
        ["restaurante"] = "Alimentação",
        ["padaria"] = "Alimentação",
        ["farmacia"] = "Saúde",
        ["remedio"] = "Saúde",
        ["drogaria"] = "Saúde",
        ["uber"] = "Transporte",
        ["99"] = "Transporte",
        ["combustivel"] = "Transporte",
        ["posto"] = "Transporte",
        ["onibus"] = "Transporte",
        ["estacionamento"] = "Transporte",
        ["aluguel"] = "Moradia",
        ["condominio"] = "Moradia",
        ["energia"] = "Moradia",
        ["agua"] = "Moradia",
        ["internet"] = "Moradia",
        ["netflix"] = "Lazer",
        ["cinema"] = "Lazer",
        ["streaming"] = "Lazer",
        ["spotify"] = "Lazer",
        ["jogo"] = "Lazer",
        ["curso"] = "Educação",
        ["livro"] = "Educação",
        ["salario"] = "Salário",
        ["rendimento"] = "Investimentos",
        ["dividendo"] = "Dividendos",
        ["reembolso"] = "Reembolso",
        ["estorno"] = "Reembolso"
    };

    public static string? Match(string text)
    {
        var normalized = text.ToLowerInvariant();
        foreach (var (keyword, category) in Map)
        {
            if (normalized.Contains(keyword))
                return category;
        }
        return null;
    }
}
