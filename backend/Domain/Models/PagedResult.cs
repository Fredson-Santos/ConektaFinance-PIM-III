namespace PIM_III_Backend.Domain.Models;

public class PagedResult<T>(List<T> items, int totalItems, int page, int pageSize)
{
    public List<T> Items { get; } = items;
    public int TotalItems { get; } = totalItems;
    public int Page { get; } = page;
    public int PageSize { get; } = pageSize;
    public int TotalPages { get; } = pageSize > 0 ? (int)Math.Ceiling(totalItems / (double)pageSize) : 0;
}
