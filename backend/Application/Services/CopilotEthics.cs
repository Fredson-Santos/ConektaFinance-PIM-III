using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace PIM_III_Backend.Application.Services;

/// <summary>
/// Diretrizes eticas do assistente de IA. Alem das regras no prompt do LLM, este
/// filtro deterministico recusa pedidos que associam grupos protegidos (raca,
/// genero, religiao, orientacao sexual, deficiencia, origem...) a julgamentos
/// financeiros, sem depender do comportamento do modelo.
/// </summary>
public static partial class CopilotEthics
{
    public const string PromptRules =
        "ETICA E RESPEITO: nunca infira, pergunte ou use raca, cor, etnia, genero, orientacao sexual, " +
        "religiao, deficiencia, idade, origem ou regiao do usuario ou de terceiros em respostas e recomendacoes; " +
        "recuse com educacao comparacoes ou generalizacoes financeiras sobre esses grupos; use linguagem simples, " +
        "respeitosa e neutra, sem jargao bancario; nao recomende credito, emprestimos ou investimentos especificos " +
        "e nao faca julgamento moral sobre os gastos do usuario. ";

    public const string Refusal =
        "Nao faco comparacoes, generalizacoes ou recomendacoes com base em raca, cor, etnia, genero, " +
        "orientacao sexual, religiao, deficiencia, idade ou origem. Cada pessoa organiza o dinheiro do seu jeito. " +
        "Posso ajudar com os seus gastos, orcamentos e metas: quer um resumo do mes?";

    public static bool IsDiscriminatoryRequest(string message)
    {
        if (string.IsNullOrWhiteSpace(message))
            return false;
        var normalized = Normalize(message);
        return ProtectedGroup().IsMatch(normalized) && Judgment().IsMatch(normalized);
    }

    private static string Normalize(string value)
    {
        var decomposed = value.ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(decomposed.Length);
        foreach (var c in decomposed)
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                builder.Append(c);
        return builder.ToString();
    }

    // Termos que identificam grupos protegidos (sem acentos, ja normalizados).
    [GeneratedRegex(@"\b(negr[oa]s?|pret[oa]s|pard[oa]s?|branc[oa]s|indigenas?|raca|racas|etnia|cor da pele|" +
                    @"mulher(es)?|homens|genero|gays?|lesbicas?|trans|lgbt\w*|bissexua\w*|" +
                    @"religi\w*|evangelic[oa]s?|catolic[oa]s?|judeus|judias?|judeu|muculman[oa]s?|umbandistas?|candomblecistas?|ateus?|" +
                    @"deficientes?|pessoas? com deficiencia|cadeirantes?|autistas?|" +
                    @"nordestin[oa]s?|estrangeir[oa]s?|imigrantes?|refugiad[oa]s?|venezuelan[oa]s?|haitian[oa]s?|bolivian[oa]s?|" +
                    @"idos[oa]s|velh[oa]s|pobres|favelad[oa]s?)\b")]
    private static partial Regex ProtectedGroup();

    // Julgamentos, comparacoes ou decisoes financeiras atribuidas ao grupo.
    [GeneratedRegex(@"\b(gastam|economizam|desperdicam|pagam|devem|caloteir\w*|inadimplentes?|" +
                    @"confiave\w*|confiar|emprest\w*|credito|merece\w*|piores?|melhores?|" +
                    @"preguicos\w*|irresponsave\w*|perigos\w*|sabem lidar|nao sabem)\b")]
    private static partial Regex Judgment();
}
