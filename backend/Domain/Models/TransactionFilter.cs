using PIM_III_Backend.Domain.Enums;

namespace PIM_III_Backend.Domain.Models;

public class TransactionFilter
{
    public int UserId { get; set; }
    public DateTime? Start { get; set; }
    public DateTime? End { get; set; }
    public int? CategoryId { get; set; }
    public TransactionType? Type { get; set; }
    public string? Search { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string SortBy { get; set; } = "transactionDate";
    public string Order { get; set; } = "desc";
}
