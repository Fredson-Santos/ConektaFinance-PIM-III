using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Exceptions;
using PIM_III_Backend.Application.Services;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Domain.Models;

namespace PIM_III_Backend.Controllers;

/// <summary>
/// Receitas e despesas do usuário.
/// </summary>
[Tags("Lançamentos")]
public class TransactionsController(ITransactionService transactionService) : BaseApiController
{
    /// <summary>Lista paginada com filtros por tipo, categoria, período e texto; soma no cabeçalho X-Total-Sum.</summary>
    [ProducesResponseType<TransactionListResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [HttpGet]
    public async Task<ActionResult<TransactionListResponse>> List(
        [FromQuery] string? type,
        [FromQuery] int? categoryId,
        [FromQuery] string? search,
        [FromQuery] int? month,
        [FromQuery] int? year,
        [FromQuery] DateTime? start,
        [FromQuery] DateTime? end,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string sortBy = "transactionDate",
        [FromQuery] string order = "desc")
    {
        var filter = BuildFilter(type, categoryId, search, month, year, start, end, page, pageSize, sortBy, order);
        var result = await transactionService.ListAsync(filter);
        var sum = await transactionService.SumAsync(filter);
        Response.Headers["X-Total-Sum"] = sum.ToString("0.00", CultureInfo.InvariantCulture);
        return Ok(result);
    }

    /// <summary>Detalha um lançamento.</summary>
    [ProducesResponseType<TransactionResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<TransactionResponse>> GetById(int id) =>
        Ok(await transactionService.GetByIdAsync(CurrentUserId, id));

    /// <summary>Registra uma receita ou despesa (dispara a verificação de teto da categoria).</summary>
    [ProducesResponseType<TransactionResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [HttpPost]
    public async Task<ActionResult<TransactionResponse>> Create(CreateTransactionRequest request)
    {
        var response = await transactionService.CreateAsync(CurrentUserId, request);
        return Created($"/api/v1/transactions/{response.Id}", response);
    }

    /// <summary>Altera um lançamento existente.</summary>
    [ProducesResponseType<TransactionResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<TransactionResponse>> Update(int id, UpdateTransactionRequest request) =>
        Ok(await transactionService.UpdateAsync(CurrentUserId, id, request));

    /// <summary>Exclui um lançamento.</summary>
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        await transactionService.DeleteAsync(CurrentUserId, id);
        return NoContent();
    }

    private TransactionFilter BuildFilter(string? type, int? categoryId, string? search, int? month, int? year,
        DateTime? start, DateTime? end, int page, int pageSize, string sortBy, string order)
    {
        TransactionType? typeFilter = null;
        if (!string.IsNullOrWhiteSpace(type))
        {
            if (!Enum.TryParse<TransactionType>(type, ignoreCase: true, out var parsed))
                throw AppException.BadRequest("Tipo invalido", "Use expense ou income.");
            typeFilter = parsed;
        }

        DateTime? filterStart = start;
        DateTime? filterEnd = end;
        if (month is > 0 and <= 12 && year is > 0)
        {
            var periodStart = new DateTime(year.Value, month.Value, 1);
            filterStart = periodStart;
            filterEnd = periodStart.AddMonths(1);
        }
        else if (month is > 12 or < 0 || year is < 0)
        {
            throw AppException.BadRequest("Periodo invalido", "Informe um mes entre 1 e 12 e um ano valido.");
        }

        return new TransactionFilter
        {
            UserId = CurrentUserId,
            Start = filterStart,
            End = filterEnd,
            CategoryId = categoryId,
            Type = typeFilter,
            Search = search,
            Page = page,
            PageSize = pageSize,
            SortBy = sortBy,
            Order = order
        };
    }
}
