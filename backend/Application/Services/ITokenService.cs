using PIM_III_Backend.Domain.Entities;

namespace PIM_III_Backend.Application.Services;

public interface ITokenService
{
    string GenerateToken(User user);
}
