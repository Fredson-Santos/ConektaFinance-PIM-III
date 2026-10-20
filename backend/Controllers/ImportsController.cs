using Microsoft.AspNetCore.Mvc;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Services;

namespace PIM_III_Backend.Controllers;

public class ImportsController(IImportService importService) : BaseApiController
{
    [HttpPost("preview")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<ActionResult<ImportPreviewResponse>> Preview(IFormFile file)
    {
        await using var stream = file.OpenReadStream();
        return Accepted(await importService.PreviewAsync(CurrentUserId, file.FileName, stream, file.Length));
    }

    [HttpPost("{id:int}/confirm")]
    public async Task<ActionResult<ImportResultResponse>> Confirm(int id, ConfirmImportRequest request) =>
        Ok(await importService.ConfirmAsync(CurrentUserId, id, request));
}
