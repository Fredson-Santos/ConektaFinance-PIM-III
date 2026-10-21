namespace PIM_III_Backend.Application.Dtos;

public record CopilotActionDto(string Tool, Dictionary<string, object?>? Args, string? Status = null);

public record CopilotMessageDto(int Id, string Role, string Content, List<CopilotActionDto>? Actions, string? ImageUrl, DateTime CreatedAt);

public record CopilotHistoryResponse(List<CopilotMessageDto> Items);

public record CopilotExchangeResponse(CopilotMessageDto UserMessage, CopilotMessageDto AssistantMessage);

public record SendCopilotMessageRequest(string Content, string? ImageBase64);
