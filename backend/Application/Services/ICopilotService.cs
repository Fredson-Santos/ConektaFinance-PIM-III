using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Domain.Enums;

namespace PIM_III_Backend.Application.Services;

public interface ICopilotService
{
    Task<CopilotHistoryResponse> GetHistoryAsync(int userId, ChatChannel channel = ChatChannel.Web);
    Task<CopilotExchangeResponse> SendMessageAsync(int userId, string content, string? imageBase64 = null, ChatChannel channel = ChatChannel.Web);
    Task<CopilotMessageDto> ConfirmDraftAsync(int userId, int messageId);
    Task<CopilotMessageDto> CancelDraftAsync(int userId, int messageId);
    Task ClearHistoryAsync(int userId, ChatChannel channel = ChatChannel.Web);
}
