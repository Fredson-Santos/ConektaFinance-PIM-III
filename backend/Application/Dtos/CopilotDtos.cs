namespace PIM_III_Backend.Application.Dtos;

public record CopilotActionDto(string Tool, Dictionary<string, object?>? Args);

public record CopilotMessageDto(int Id, string Role, string Content, List<CopilotActionDto>? Actions, DateTime CreatedAt);

public record CopilotHistoryResponse(List<CopilotMessageDto> Items);

public record CopilotExchangeResponse(CopilotMessageDto UserMessage, CopilotMessageDto AssistantMessage);

public record SendCopilotMessageRequest(string Content);
