using PIM_III_Backend.Application.Dtos;

namespace PIM_III_Backend.Application.Services;

public interface ICopilotService
{
    Task<CopilotHistoryResponse> GetHistoryAsync(int userId);
    Task<CopilotExchangeResponse> SendMessageAsync(int userId, string content, string? imageBase64 = null);
    Task<CopilotMessageDto> ConfirmDraftAsync(int userId, int messageId);
    Task ClearHistoryAsync(int userId);
}
