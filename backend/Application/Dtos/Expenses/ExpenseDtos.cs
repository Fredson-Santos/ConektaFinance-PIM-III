using PIM_III_Backend.Domain.Enums;

namespace PIM_III_Backend.Application.Dtos.Expenses;

public record ExpenseResponse(
    int Id,
    int UserId,
    int CategoryId,
    string CategoryName,
    string Description,
    decimal Value,
    DateTime TransactionDate,
    string Observation,
    bool IsRecurrent,
    ExpenseStatus Status,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateExpenseRequest(
    int CategoryId,
    string Description,
    decimal Value,
    DateTime TransactionDate,
    string Observation,
    bool IsRecurrent
);

public record UpdateExpenseRequest(
    int CategoryId,
    string Description,
    decimal Value,
    DateTime TransactionDate,
    string Observation,
    bool IsRecurrent,
    ExpenseStatus Status
);
