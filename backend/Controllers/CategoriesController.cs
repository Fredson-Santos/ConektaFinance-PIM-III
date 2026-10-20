using Microsoft.AspNetCore.Mvc;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Services;

namespace PIM_III_Backend.Controllers;

public class CategoriesController(ICategoryService categoryService) : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<List<CategoryResponse>>> List(
        [FromQuery] string? kind, [FromQuery] int? month, [FromQuery] int? year) =>
        Ok(await categoryService.ListAsync(CurrentUserId, kind, month, year));

    [HttpPost]
    public async Task<ActionResult<CategoryResponse>> Create(CreateCategoryRequest request)
    {
        var response = await categoryService.CreateAsync(CurrentUserId, request);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<CategoryResponse>> Update(int id, UpdateCategoryRequest request) =>
        Ok(await categoryService.UpdateAsync(CurrentUserId, id, request));

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        await categoryService.DeleteAsync(CurrentUserId, id);
        return NoContent();
    }
}
