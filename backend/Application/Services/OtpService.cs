using System.Security.Cryptography;
using System.Text;
using BCrypt.Net;
using Microsoft.Extensions.Configuration;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Exceptions;
using PIM_III_Backend.Domain.Constants;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Application.Services;

public class OtpService(
    IOtpRepository otpRepository,
    IUserRepository userRepository,
    ICategoryRepository categoryRepository,
    ITokenService tokenService,
    IOtpSender otpSender,
    IConfiguration configuration) : IOtpService
{
    public async Task<OtpRequestResponse> RequestOtpAsync(string phone)
    {
        var normalized = NormalizePhone(phone);
        var now = DateTime.UtcNow;
        var window = configuration.GetValue("Otp:ResendWindowSeconds", 45);

        var latest = await otpRepository.GetLatestByPhoneAsync(normalized);
        if (latest is not null && (now - latest.CreatedAt).TotalSeconds < window)
        {
            var remaining = window - (int)(now - latest.CreatedAt).TotalSeconds;
            throw AppException.TooManyRequests("Reenvio nao permitido",
                $"Aguarde {remaining} segundos para solicitar um novo codigo.");
        }

        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        var expirationMinutes = configuration.GetValue("Otp:ExpirationMinutes", 5);
        var otp = new OtpCode
        {
            Phone = normalized,
            CodeHash = HashCode(code),
            ExpiresAt = now.AddMinutes(expirationMinutes),
            Purpose = OtpPurpose.Login,
            CreatedAt = now
        };
        await otpRepository.AddAsync(otp);
        await otpSender.SendAsync(normalized, code);

        var devMode = configuration.GetValue("Otp:DevMode", false);
        return new OtpRequestResponse(window, devMode ? code : null);
    }

    public async Task<AuthResponse> VerifyOtpAsync(VerifyOtpRequest request)
    {
        var normalized = NormalizePhone(request.Phone);
        var now = DateTime.UtcNow;
        var otp = await otpRepository.GetLatestByPhoneAsync(normalized);
        if (otp is null || otp.ConsumedAt is not null)
            throw AppException.Unauthorized("Codigo invalido", "Solicite um novo codigo pelo WhatsApp.");
        if (otp.ExpiresAt < now)
            throw AppException.BadRequest("Codigo expirado", "Solicite um novo codigo pelo WhatsApp.");

        if (otp.CodeHash != HashCode(request.Code))
        {
            otp.Attempts++;
            await otpRepository.UpdateAsync(otp);
            if (otp.Attempts >= configuration.GetValue("Otp:MaxAttempts", 3))
                throw AppException.TooManyRequests("Limite de tentativas excedido", "Solicite um novo codigo pelo WhatsApp.");
            throw AppException.Unauthorized("Codigo invalido", "O codigo informado nao confere.");
        }

        otp.ConsumedAt = now;
        await otpRepository.UpdateAsync(otp);

        var user = await userRepository.GetByPhoneAsync(normalized);
        if (user is null)
        {
            user = new User
            {
                FullName = $"Contato {normalized}",
                Email = $"{normalized}@wa.conektafinance.com",
                Phone = normalized,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N"))
            };
            await userRepository.AddAsync(user);
            await categoryRepository.AddRangeAsync(CategoryTemplates.CloneForUser(user.Id));
        }
        AuthService.EnsureActive(user);

        return new AuthResponse(tokenService.GenerateToken(user), AuthService.MapUser(user));
    }

    private static string NormalizePhone(string phone)
    {
        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (digits.Length is < 10 or > 11)
            throw AppException.BadRequest("Telefone invalido", "Informe o DDD e o numero completo do WhatsApp.");
        return digits;
    }

    private static string HashCode(string code) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(code)));
}
