using System.Text.Json;
using System.Text;
using PIM_III_Backend.Application.Dtos.Chat;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Application.Services;

public interface IChatService
{
    Task<IEnumerable<ChatMessageDto>> GetHistoryAsync(int userId);
    Task<ChatMessageDto> SendMessageAsync(int userId, string content);
    Task ClearHistoryAsync(int userId);
}

public class ChatService : IChatService
{
    private readonly IChatRepository _repository;
    private readonly IUserRepository _userRepository;
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public ChatService(IChatRepository repository, IUserRepository userRepository, HttpClient httpClient, IConfiguration configuration)
    {
        _repository = repository;
        _userRepository = userRepository;
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task<IEnumerable<ChatMessageDto>> GetHistoryAsync(int userId)
    {
        var messages = await _repository.GetByUserIdAsync(userId);
        return messages.Select(m => new ChatMessageDto(m.Id, m.Role, m.Content, m.CreatedAt));
    }

    public async Task<ChatMessageDto> SendMessageAsync(int userId, string content)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null) throw new UnauthorizedAccessException("Usuário não encontrado.");

        // 1. Save user message
        var userMessage = new ChatMessage
        {
            UserId = userId,
            Role = "user",
            Content = content,
            CreatedAt = DateTime.UtcNow
        };
        await _repository.AddAsync(userMessage);

        // 2. Call n8n Webhook
        var webhookUrl = _configuration["IntegrationSettings:N8nChatWebhookUrl"];
        if (string.IsNullOrEmpty(webhookUrl))
        {
            // Mock response if no webhook configured
            return await SaveAssistantMessageAsync(userId, "O webhook do n8n (N8nChatWebhookUrl) não está configurado. Resposta simulada pelo assistente.");
        }

        try
        {
            var payload = new
            {
                sessionId = userId.ToString(),
                userEmail = user.Email,
                userName = user.FullName,
                message = content
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(webhookUrl, jsonContent);

            if (response.IsSuccessStatusCode)
            {
                var responseBody = await response.Content.ReadAsStringAsync();
                
                // n8n should respond with a JSON like { "reply": "A resposta da IA..." } or just plain text.
                // We try to parse it, if it fails, we use the raw string.
                string assistantReply;
                try
                {
                    using var doc = JsonDocument.Parse(responseBody);
                    assistantReply = doc.RootElement.GetProperty("reply").GetString() ?? responseBody;
                }
                catch
                {
                    assistantReply = responseBody;
                }

                if (string.IsNullOrWhiteSpace(assistantReply))
                {
                    assistantReply = "Desculpe, o assistente inteligente não conseguiu gerar uma resposta no momento. Por favor, tente novamente em breve.";
                }

                return await SaveAssistantMessageAsync(userId, assistantReply);
            }
            else
            {
                return await SaveAssistantMessageAsync(userId, $"Erro na comunicação com o assistente inteligente: {response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            return await SaveAssistantMessageAsync(userId, $"Erro ao conectar com o n8n: {ex.Message}");
        }
    }

    public async Task ClearHistoryAsync(int userId)
    {
        await _repository.ClearHistoryAsync(userId);
    }

    private async Task<ChatMessageDto> SaveAssistantMessageAsync(int userId, string content)
    {
        var msg = new ChatMessage
        {
            UserId = userId,
            Role = "assistant",
            Content = content,
            CreatedAt = DateTime.UtcNow
        };
        await _repository.AddAsync(msg);
        return new ChatMessageDto(msg.Id, msg.Role, msg.Content, msg.CreatedAt);
    }
}
