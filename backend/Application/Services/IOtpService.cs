using ConektaFinance.Api.Application.Dtos;

namespace ConektaFinance.Api.Application.Services;

public interface IOtpService
{
    Task<OtpRequestResponse> RequestOtpAsync(string phone);
    Task<AuthResponse> VerifyOtpAsync(VerifyOtpRequest request);
}

public interface IOtpSender
{
    Task SendAsync(string phone, string code);
}
