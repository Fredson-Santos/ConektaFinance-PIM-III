namespace PIM_III_Backend.Application.Services;

/// <summary>
/// Normalizacao de telefones entre o formato do dominio (10-11 digitos, sem
/// prefixo de pais) e os formatos da Evolution API (jid "5511987654321@s.whatsapp.net").
/// </summary>
public static class WhatsAppNumbers
{
    /// <summary>
    /// Extrai o telefone do dominio a partir do jid da Evolution. Grupos (@g.us),
    /// listas de transmissao, newsletters e formatos invalidos retornam null.
    /// </summary>
    public static string? TryNormalizeFromJid(string? remoteJid)
    {
        if (string.IsNullOrWhiteSpace(remoteJid))
            return null;
        if (!remoteJid.EndsWith("@s.whatsapp.net", StringComparison.OrdinalIgnoreCase))
            return null;
        // Remove o sufixo do jid e o indice de dispositivo (ex.: "5511...:5").
        var local = remoteJid.Split('@')[0].Split(':')[0];
        var digits = new string(local.Where(char.IsDigit).ToArray());
        return NormalizeDigits(digits);
    }

    /// <summary>
    /// Normaliza um telefone digitado no cadastro ou no perfil (com ou sem
    /// formatacao, com ou sem +55) para o padrao do dominio, garantindo que o
    /// lookup do canal WhatsApp encontre o usuario. Sem digitos retorna null;
    /// entradas exoticas preservam apenas os digitos.
    /// </summary>
    public static string? NormalizePhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return null;
        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (digits.Length == 0)
            return null;
        return NormalizeDigits(digits) ?? digits;
    }

    /// <summary>Converte telefone do dominio (10-11 digitos) no numero da Evolution (com 55).</summary>
    public static string ToEvolution(string phone)
    {
        var digits = new string((phone ?? string.Empty).Where(char.IsDigit).ToArray());
        if (digits.Length is >= 10 and <= 11)
            return $"55{digits}";
        return digits;
    }

    private static string? NormalizeDigits(string digits)
    {
        if (digits.Length is >= 12 and <= 13 && digits.StartsWith("55", StringComparison.Ordinal))
            digits = digits[2..];
        return digits.Length is >= 10 and <= 11 ? digits : null;
    }
}
