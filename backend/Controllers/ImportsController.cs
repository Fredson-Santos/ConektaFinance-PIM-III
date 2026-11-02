using Microsoft.AspNetCore.Mvc;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Services;

namespace PIM_III_Backend.Controllers;

/// <summary>
/// Importação de extratos bancários (OFX, CSV e XLSX).
/// </summary>
[Tags("Importação")]
public class ImportsController(IImportService importService) : BaseApiController
{
    /// <summary>Lê o arquivo e devolve a prévia dos lançamentos com categoria sugerida e duplicados marcados.</summary>
    [ProducesResponseType<ImportPreviewResponse>(StatusCodes.Status202Accepted)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [HttpPost("preview")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<ActionResult<ImportPreviewResponse>> Preview(IFormFile file)
    {
        await using var stream = file.OpenReadStream();
        return Accepted(await importService.PreviewAsync(CurrentUserId, file.FileName, stream, file.Length));
    }

    /// <summary>Confirma a importação dos itens selecionados da prévia.</summary>
    [ProducesResponseType<ImportResultResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [HttpPost("{id:int}/confirm")]
    public async Task<ActionResult<ImportResultResponse>> Confirm(int id, ConfirmImportRequest request) =>
        Ok(await importService.ConfirmAsync(CurrentUserId, id, request));
}
