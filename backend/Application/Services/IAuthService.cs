using System.Threading.Tasks;
using PIM_III_Backend.Application.DTOs;

namespace PIM_III_Backend.Application.Services;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
}
