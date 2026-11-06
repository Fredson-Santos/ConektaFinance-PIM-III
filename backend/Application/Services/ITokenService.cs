using ConektaFinance.Api.Domain.Entities;

namespace ConektaFinance.Api.Application.Services;

public interface ITokenService
{
    string GenerateToken(User user);
}
