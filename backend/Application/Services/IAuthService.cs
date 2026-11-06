using ConektaFinance.Api.Application.Dtos;

namespace ConektaFinance.Api.Application.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> DemoLoginAsync();
}
