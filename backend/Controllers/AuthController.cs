using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Services;

namespace PIM_III_Backend.Controllers;

/// <summary>
/// Cadastro e login por e-mail, código OTP via WhatsApp e conta de demonstração.
/// </summary>
[Tags("Autenticação")]
[AllowAnonymous]
public class AuthController(IAuthService authService, IOtpService otpService) : BaseApiController
{
    /// <summary>Cria uma conta com e-mail e senha e devolve o token JWT.</summary>
    [ProducesResponseType<AuthResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    [EnableRateLimiting("auth")]
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var response = await authService.RegisterAsync(request);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    /// <summary>Autentica com e-mail e senha e devolve o token JWT.</summary>
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    [EnableRateLimiting("auth")]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var response = await authService.LoginAsync(request);
        return Ok(response);
    }

    /// <summary>Envia um código de 6 dígitos pelo WhatsApp (reenvio liberado após a janela de espera).</summary>
    [ProducesResponseType<OtpRequestResponse>(StatusCodes.Status202Accepted)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    [EnableRateLimiting("otp")]
    [HttpPost("otp/request")]
    public async Task<ActionResult<OtpRequestResponse>> RequestOtp(RequestOtpRequest request)
    {
        var response = await otpService.RequestOtpAsync(request.Phone);
        return Accepted(response);
    }

    /// <summary>Valida o código OTP; cria a conta no primeiro acesso e devolve o token JWT.</summary>
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    [EnableRateLimiting("auth")]
    [HttpPost("otp/verify")]
    public async Task<ActionResult<AuthResponse>> VerifyOtp(VerifyOtpRequest request)
    {
        var response = await otpService.VerifyOtpAsync(request);
        return Ok(response);
    }

    /// <summary>Entra na conta de demonstração pré-carregada.</summary>
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    [EnableRateLimiting("auth")]
    [HttpPost("demo")]
    public async Task<ActionResult<AuthResponse>> DemoLogin()
    {
        var response = await authService.DemoLoginAsync();
        return Ok(response);
    }
}
