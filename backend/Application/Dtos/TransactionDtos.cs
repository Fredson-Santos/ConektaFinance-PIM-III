using ConektaFinance.Api.Domain.Enums;

namespace ConektaFinance.Api.Application.Dtos;

public record CategoryBrief(int Id, string Name, string ColorCode, string Icon);

public record TransactionResponse(
    int Id,
    TransactionType Type,
    string Description,
    decimal Value,
    DateTime TransactionDate,
    PaymentMethod? PaymentMethod,
    string? Observation,
    bool IsRecurrent,
    TransactionStatus Status,
    TransactionSource Source,
    CategoryBrief Category,
    DateTime CreatedAt);

public record CreateTransactionRequest(
    TransactionType Type,
    int CategoryId,
    string Description,
    decimal Value,
    DateTime TransactionDate,
    PaymentMethod? PaymentMethod,
    string? Observation,
    bool? IsRecurrent);

public record UpdateTransactionRequest(
    TransactionType Type,
    int CategoryId,
    string Description,
    decimal Value,
    DateTime TransactionDate,
    PaymentMethod? PaymentMethod,
    string? Observation,
    bool? IsRecurrent,
    TransactionStatus? Status);

public record PaginationMeta(int Page, int PageSize, int TotalItems, int TotalPages);

public record TransactionListResponse(List<TransactionResponse> Items, PaginationMeta Meta);
