using PIM_III_Backend.Application.Dtos;

namespace PIM_III_Backend.Application.Services;

public interface IOtpService
{
    Task<OtpRequestResponse> RequestOtpAsync(string phone);
    Task<AuthResponse> VerifyOtpAsync(VerifyOtpRequest request);
}

public interface IOtpSender
{
    Task SendAsync(string phone, string code);
}
