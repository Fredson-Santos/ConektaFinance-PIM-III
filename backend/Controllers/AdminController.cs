using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Services;
using PIM_III_Backend.Domain.Constants;

namespace PIM_III_Backend.Controllers;

[Authorize(Roles = AccountTypes.Admin)]
public class AdminController(IAdminService adminService) : BaseApiController
{
    [HttpGet("metrics")]
    public async Task<ActionResult<AdminMetricsResponse>> Metrics() =>
        Ok(await adminService.GetMetricsAsync());

    [HttpGet("users")]
    public async Task<ActionResult<AdminUserListResponse>> Users(
        [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(await adminService.ListUsersAsync(search, page, pageSize));

    [HttpPatch("users/{id:int}/status")]
    public async Task<ActionResult<AdminUserResponse>> UpdateStatus(int id, UpdateUserStatusRequest request) =>
        Ok(await adminService.UpdateStatusAsync(CurrentUserId, id, request.IsActive));
}
