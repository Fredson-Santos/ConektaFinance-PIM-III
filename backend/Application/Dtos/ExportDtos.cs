namespace ConektaFinance.Api.Application.Dtos;

public record PeriodExportResponse(DateTime Start, DateTime End, List<TransactionResponse> Transactions);

public record DeleteAccountRequest(string Password);
