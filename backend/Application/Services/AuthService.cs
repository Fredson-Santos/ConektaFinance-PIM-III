using BCrypt.Net;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Exceptions;
using PIM_III_Backend.Domain.Constants;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Application.Services;

public class AuthService(
    IUserRepository userRepository,
    ICategoryRepository categoryRepository,
    ITokenService tokenService) : IAuthService
{
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await userRepository.GetByEmailAsync(email) is not null)
            throw AppException.Conflict("E-mail ja cadastrado", "Utilize outro e-mail ou faca login.");

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            Phone = request.Phone?.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            MonthlyCeiling = request.MonthlyCeiling ?? 0m
        };
        await userRepository.AddAsync(user);
        await categoryRepository.AddRangeAsync(CategoryTemplates.CloneForUser(user.Id));

        return new AuthResponse(tokenService.GenerateToken(user), MapUser(user));
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await userRepository.GetByEmailAsync(request.Email.Trim().ToLowerInvariant());
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw AppException.Unauthorized("Credenciais invalidas", "E-mail ou senha incorretos.");

        return new AuthResponse(tokenService.GenerateToken(user), MapUser(user));
    }

    internal static UserResponse MapUser(User user) => new(
        user.Id,
        user.FullName,
        user.DisplayName,
        user.Email,
        user.Phone,
        user.Cpf,
        user.Occupation,
        user.AvatarUrl,
        user.AccountType,
        user.MonthlyCeiling,
        user.Currency,
        user.CycleStartDay);
}
