using Microsoft.AspNetCore.Mvc;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Services;

namespace PIM_III_Backend.Controllers;

/// <summary>
/// Categorias de receitas e despesas do usuário.
/// </summary>
[Tags("Categorias")]
public class CategoriesController(ICategoryService categoryService) : BaseApiController
{
    /// <summary>Lista as categorias, com filtro por tipo e, se informado o período, gasto e teto do mês.</summary>
    [ProducesResponseType<List<CategoryResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [HttpGet]
    public async Task<ActionResult<List<CategoryResponse>>> List(
        [FromQuery] string? kind, [FromQuery] int? month, [FromQuery] int? year) =>
        Ok(await categoryService.ListAsync(CurrentUserId, kind, month, year));

    /// <summary>Cria uma categoria personalizada.</summary>
    [ProducesResponseType<CategoryResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [HttpPost]
    public async Task<ActionResult<CategoryResponse>> Create(CreateCategoryRequest request)
    {
        var response = await categoryService.CreateAsync(CurrentUserId, request);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    /// <summary>Atualiza nome, cor, ícone ou descrição de uma categoria.</summary>
    [ProducesResponseType<CategoryResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<CategoryResponse>> Update(int id, UpdateCategoryRequest request) =>
        Ok(await categoryService.UpdateAsync(CurrentUserId, id, request));

    /// <summary>Exclui uma categoria sem lançamentos vinculados.</summary>
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        await categoryService.DeleteAsync(CurrentUserId, id);
        return NoContent();
    }
}
