namespace ConektaFinance.Api.Application.Dtos;

public record RequestOtpRequest(string Phone);

public record VerifyOtpRequest(string Phone, string Code);

public record OtpRequestResponse(int ResendAllowedInSeconds, string? DevCode);
