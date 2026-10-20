namespace PIM_III_Backend.Application.Dtos;

public record UserResponse(
    int Id,
    string FullName,
    string? DisplayName,
    string Email,
    string? Phone,
    string? Cpf,
    string? Occupation,
    string? AvatarUrl,
    string AccountType,
    decimal MonthlyCeiling,
    string Currency,
    int CycleStartDay);

public record AuthResponse(string Token, UserResponse User);

public record RegisterRequest(string FullName, string Email, string Password, string? Phone, decimal? MonthlyCeiling);

public record LoginRequest(string Email, string Password);
