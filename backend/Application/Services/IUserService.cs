using PIM_III_Backend.Application.Dtos;

namespace PIM_III_Backend.Application.Services;

public interface IUserService
{
    Task<UserResponse> GetProfileAsync(int userId);
    Task<UserResponse> UpdateProfileAsync(int userId, UpdateProfileRequest request);
    Task<AvatarResponse> UpdateAvatarAsync(int userId, Stream content, string contentType, long length);
    Task ChangePasswordAsync(int userId, ChangePasswordRequest request);
    Task<UserResponse> CompleteOnboardingAsync(int userId, CompleteOnboardingRequest request);
    Task<PreferencesResponse> GetPreferencesAsync(int userId);
    Task<PreferencesResponse> UpdatePreferencesAsync(int userId, UpdatePreferencesRequest request);
    Task ResetFinancialDataAsync(int userId);
    Task DeleteAccountAsync(int userId, string password);
}

public interface IAvatarStorage
{
    Task<string> SaveAsync(int userId, string extension, Stream content);
    Task DeleteAsync(string? publicUrl);
}
