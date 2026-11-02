namespace PIM_III_Backend.Application.Services;

/// <summary>
/// Persiste imagens anexadas à conversa do assistente (ex.: foto de nota fiscal).
/// </summary>
public interface ICopilotImageStorage
{
    Task<string> SaveAsync(int userId, string extension, Stream content);
}
