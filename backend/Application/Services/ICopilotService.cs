using PIM_III_Backend.Application.Dtos;

namespace PIM_III_Backend.Application.Services;

public interface ICopilotService
{
    Task<CopilotHistoryResponse> GetHistoryAsync(int userId);
    Task<CopilotExchangeResponse> SendMessageAsync(int userId, string content);
    Task ClearHistoryAsync(int userId);
}
