namespace PIM_III_Backend.Application.Dtos;

public record UpdateProfileRequest(string? FullName, string? DisplayName, string? Phone, string? Cpf, string? Occupation);

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public record PreferencesResponse(decimal MonthlyCeiling, string Currency, int CycleStartDay);

public record UpdatePreferencesRequest(decimal? MonthlyCeiling, string? Currency, int? CycleStartDay);

public record AvatarResponse(string AvatarUrl);
