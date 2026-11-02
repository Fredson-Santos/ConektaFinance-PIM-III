using Microsoft.AspNetCore.Mvc;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Services;

namespace PIM_III_Backend.Controllers;

/// <summary>
/// Dados da conta, preferências, onboarding e zona de perigo.
/// </summary>
[Tags("Perfil")]
public class UsersController(IUserService userService) : BaseApiController
{
    /// <summary>Dados do usuário autenticado.</summary>
    [ProducesResponseType<UserResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [HttpGet("me")]
    public async Task<ActionResult<UserResponse>> GetProfile() =>
        Ok(await userService.GetProfileAsync(CurrentUserId));

    /// <summary>Atualiza nome, telefone, CPF e profissão.</summary>
    [ProducesResponseType<UserResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [HttpPut("me")]
    public async Task<ActionResult<UserResponse>> UpdateProfile(UpdateProfileRequest request) =>
        Ok(await userService.UpdateProfileAsync(CurrentUserId, request));

    /// <summary>Envia a foto de perfil (JPG, PNG ou WebP até 2 MB).</summary>
    [ProducesResponseType<AvatarResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [HttpPut("me/avatar")]
    [RequestSizeLimit(4 * 1024 * 1024)]
    public async Task<ActionResult<AvatarResponse>> UpdateAvatar(IFormFile file)
    {
        await using var stream = file.OpenReadStream();
        return Ok(await userService.UpdateAvatarAsync(CurrentUserId, stream, file.ContentType, file.Length));
    }

    /// <summary>Troca a senha mediante a senha atual.</summary>
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [HttpPut("me/password")]
    public async Task<ActionResult> ChangePassword(ChangePasswordRequest request)
    {
        await userService.ChangePasswordAsync(CurrentUserId, request);
        return NoContent();
    }

    /// <summary>Conclui o primeiro acesso: nome, e-mail, senha e teto mensal.</summary>
    [ProducesResponseType<UserResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [HttpPut("me/onboarding")]
    public async Task<ActionResult<UserResponse>> CompleteOnboarding(CompleteOnboardingRequest request) =>
        Ok(await userService.CompleteOnboardingAsync(CurrentUserId, request));

    /// <summary>Preferências financeiras (teto, moeda e início do ciclo).</summary>
    [ProducesResponseType<PreferencesResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [HttpGet("me/preferences")]
    public async Task<ActionResult<PreferencesResponse>> GetPreferences() =>
        Ok(await userService.GetPreferencesAsync(CurrentUserId));

    /// <summary>Atualiza as preferências financeiras.</summary>
    [ProducesResponseType<PreferencesResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [HttpPut("me/preferences")]
    public async Task<ActionResult<PreferencesResponse>> UpdatePreferences(UpdatePreferencesRequest request) =>
        Ok(await userService.UpdatePreferencesAsync(CurrentUserId, request));

    /// <summary>Apaga lançamentos, tetos e alertas, mantendo a conta e as categorias.</summary>
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [HttpPost("me/reset-data")]
    public async Task<ActionResult> ResetData()
    {
        await userService.ResetFinancialDataAsync(CurrentUserId);
        return NoContent();
    }

    /// <summary>Exclui definitivamente a conta mediante confirmação da senha.</summary>
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [HttpDelete("me")]
    public async Task<ActionResult> DeleteAccount(DeleteAccountRequest request)
    {
        await userService.DeleteAccountAsync(CurrentUserId, request.Password);
        return NoContent();
    }
}
