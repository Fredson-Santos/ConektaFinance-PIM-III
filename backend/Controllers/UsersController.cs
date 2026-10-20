using Microsoft.AspNetCore.Mvc;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Services;

namespace PIM_III_Backend.Controllers;

public class UsersController(IUserService userService) : BaseApiController
{
    [HttpGet("me")]
    public async Task<ActionResult<UserResponse>> GetProfile() =>
        Ok(await userService.GetProfileAsync(CurrentUserId));

    [HttpPut("me")]
    public async Task<ActionResult<UserResponse>> UpdateProfile(UpdateProfileRequest request) =>
        Ok(await userService.UpdateProfileAsync(CurrentUserId, request));

    [HttpPut("me/avatar")]
    [RequestSizeLimit(4 * 1024 * 1024)]
    public async Task<ActionResult<AvatarResponse>> UpdateAvatar(IFormFile file)
    {
        await using var stream = file.OpenReadStream();
        return Ok(await userService.UpdateAvatarAsync(CurrentUserId, stream, file.ContentType, file.Length));
    }

    [HttpPut("me/password")]
    public async Task<ActionResult> ChangePassword(ChangePasswordRequest request)
    {
        await userService.ChangePasswordAsync(CurrentUserId, request);
        return NoContent();
    }

    [HttpGet("me/preferences")]
    public async Task<ActionResult<PreferencesResponse>> GetPreferences() =>
        Ok(await userService.GetPreferencesAsync(CurrentUserId));

    [HttpPut("me/preferences")]
    public async Task<ActionResult<PreferencesResponse>> UpdatePreferences(UpdatePreferencesRequest request) =>
        Ok(await userService.UpdatePreferencesAsync(CurrentUserId, request));

    [HttpPost("me/reset-data")]
    public async Task<ActionResult> ResetData()
    {
        await userService.ResetFinancialDataAsync(CurrentUserId);
        return NoContent();
    }

    [HttpDelete("me")]
    public async Task<ActionResult> DeleteAccount(DeleteAccountRequest request)
    {
        await userService.DeleteAccountAsync(CurrentUserId, request.Password);
        return NoContent();
    }
}
