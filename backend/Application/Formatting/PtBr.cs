using System.Globalization;

namespace PIM_III_Backend.Application.Formatting;

// Cultura usada nos textos exibidos ao usuário (valores em R$ e percentuais).
// O container roda com a cultura invariante, que formataria "R$ 45.00" em vez de "R$ 45,00";
// por isso as mensagens usam string.Create(PtBr.Culture, $"...") em vez da cultura atual.
// Não usar em chaves, hashes ou formatos trocados entre sistemas: esses continuam invariantes.
public static class PtBr
{
    public static readonly CultureInfo Culture = CultureInfo.GetCultureInfo("pt-BR");
}
