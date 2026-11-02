using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Services;
using PIM_III_Backend.Domain.Constants;

namespace PIM_III_Backend.Controllers;

/// <summary>
/// Estrutura administrativa: métricas da plataforma e gestão de contas (perfil Admin).
/// </summary>
[Tags("Administração")]
[Authorize(Roles = AccountTypes.Admin)]
public class AdminController(IAdminService adminService) : BaseApiController
{
    /// <summary>Indicadores gerais da plataforma (usuários, atividade, lançamentos, alertas e uso da IA).</summary>
    [ProducesResponseType<AdminMetricsResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [HttpGet("metrics")]
    public async Task<ActionResult<AdminMetricsResponse>> Metrics() =>
        Ok(await adminService.GetMetricsAsync());

    /// <summary>Lista paginada de usuários com busca por nome, e-mail ou telefone.</summary>
    [ProducesResponseType<AdminUserListResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [HttpGet("users")]
    public async Task<ActionResult<AdminUserListResponse>> Users(
        [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(await adminService.ListUsersAsync(search, page, pageSize));

    /// <summary>Ativa ou desativa uma conta. Contas desativadas não conseguem autenticar.</summary>
    [ProducesResponseType<AdminUserResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [HttpPatch("users/{id:int}/status")]
    public async Task<ActionResult<AdminUserResponse>> UpdateStatus(int id, UpdateUserStatusRequest request) =>
        Ok(await adminService.UpdateStatusAsync(CurrentUserId, id, request.IsActive));
}
