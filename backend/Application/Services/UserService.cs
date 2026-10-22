using BCrypt.Net;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Exceptions;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Application.Services;

public class UserService(
    IUserRepository userRepository,
    IAvatarStorage avatarStorage,
    ITransactionRepository transactionRepository,
    IBudgetRepository budgetRepository,
    IAlertRepository alertRepository) : IUserService
{
    private static readonly HashSet<string> AllowedAvatarTypes = ["image/jpeg", "image/png", "image/webp"];
    private const long MaxAvatarBytes = 2 * 1024 * 1024;

    public async Task<UserResponse> GetProfileAsync(int userId)
    {
        var user = await GetRequiredUserAsync(userId);
        return AuthService.MapUser(user);
    }

    public async Task<UserResponse> UpdateProfileAsync(int userId, UpdateProfileRequest request)
    {
        var user = await GetRequiredUserAsync(userId);
        if (!string.IsNullOrWhiteSpace(request.FullName))
            user.FullName = request.FullName.Trim();
        if (request.DisplayName is not null)
            user.DisplayName = string.IsNullOrWhiteSpace(request.DisplayName) ? null : request.DisplayName.Trim();
        if (request.Phone is not null)
            user.Phone = WhatsAppNumbers.NormalizePhone(request.Phone);
        if (request.Cpf is not null)
            user.Cpf = string.IsNullOrWhiteSpace(request.Cpf) ? null : request.Cpf.Trim();
        if (request.Occupation is not null)
            user.Occupation = string.IsNullOrWhiteSpace(request.Occupation) ? null : request.Occupation.Trim();
        await userRepository.UpdateAsync(user);
        return AuthService.MapUser(user);
    }

    public async Task<AvatarResponse> UpdateAvatarAsync(int userId, Stream content, string contentType, long length)
    {
        if (!AllowedAvatarTypes.Contains(contentType))
            throw AppException.BadRequest("Formato invalido", "Envie uma imagem JPG, PNG ou WebP de ate 2MB.");
        if (length <= 0 || length > MaxAvatarBytes)
            throw AppException.BadRequest("Arquivo invalido", "A imagem deve ter ate 2MB.");

        var user = await GetRequiredUserAsync(userId);
        await avatarStorage.DeleteAsync(user.AvatarUrl);
        var extension = contentType == "image/jpeg" ? ".jpg"
            : contentType == "image/png" ? ".png"
            : ".webp";
        var url = await avatarStorage.SaveAsync(userId, extension, content);
        user.AvatarUrl = url;
        await userRepository.UpdateAsync(user);
        return new AvatarResponse(url);
    }

    public async Task ChangePasswordAsync(int userId, ChangePasswordRequest request)
    {
        var user = await GetRequiredUserAsync(userId);
        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            throw AppException.BadRequest("Senha atual incorreta", "Confirme sua senha atual antes de alterar.");
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await userRepository.UpdateAsync(user);
    }

    public async Task<PreferencesResponse> GetPreferencesAsync(int userId)
    {
        var user = await GetRequiredUserAsync(userId);
        return MapPreferences(user);
    }

    public async Task<PreferencesResponse> UpdatePreferencesAsync(int userId, UpdatePreferencesRequest request)
    {
        var user = await GetRequiredUserAsync(userId);
        if (request.MonthlyCeiling.HasValue)
            user.MonthlyCeiling = request.MonthlyCeiling.Value;
        if (!string.IsNullOrWhiteSpace(request.Currency))
            user.Currency = request.Currency.Trim().ToUpperInvariant();
        if (request.CycleStartDay.HasValue)
        {
            if (request.CycleStartDay.Value is < 1 or > 28)
                throw AppException.BadRequest("Dia de ciclo invalido", "Escolha um dia entre 1 e 28.");
            user.CycleStartDay = request.CycleStartDay.Value;
        }
        await userRepository.UpdateAsync(user);
        return MapPreferences(user);
    }

    public async Task ResetFinancialDataAsync(int userId)
    {
        var user = await GetRequiredUserAsync(userId);
        await transactionRepository.DeleteAllForUserAsync(userId);
        await budgetRepository.DeleteAllForUserAsync(userId);
        await alertRepository.DeleteAllForUserAsync(userId);
        await userRepository.UpdateAsync(user);
    }

    public async Task DeleteAccountAsync(int userId, string password)
    {
        var user = await GetRequiredUserAsync(userId);
        if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            throw AppException.BadRequest("Senha incorreta", "Confirme sua senha para excluir a conta.");
        await avatarStorage.DeleteAsync(user.AvatarUrl);
        await userRepository.DeleteAsync(user);
    }

    private async Task<Domain.Entities.User> GetRequiredUserAsync(int userId)
    {
        var user = await userRepository.GetByIdAsync(userId)
            ?? throw AppException.NotFound("Usuario nao encontrado", "Sua sessao pode estar invalida.");
        return user;
    }

    private static PreferencesResponse MapPreferences(Domain.Entities.User user) =>
        new(user.MonthlyCeiling, user.Currency, user.CycleStartDay);
}
