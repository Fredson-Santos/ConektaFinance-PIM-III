using System.Security.Cryptography;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Moq;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Exceptions;
using PIM_III_Backend.Application.Services;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Tests.Unit.Services;

public class OtpServiceTests
{
    private readonly Mock<IOtpRepository> _otpRepository = new();
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly Mock<ICategoryRepository> _categoryRepository = new();
    private readonly Mock<ITokenService> _tokenService = new();
    private readonly Mock<IOtpSender> _otpSender = new();
    private readonly OtpService _service;
    private readonly IConfiguration _configuration;

    public OtpServiceTests()
    {
        _configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Otp:ExpirationMinutes"] = "5",
            ["Otp:ResendWindowSeconds"] = "45",
            ["Otp:MaxAttempts"] = "3",
            ["Otp:DevMode"] = "true"
        }).Build();
        _tokenService.Setup(t => t.GenerateToken(It.IsAny<User>())).Returns("token-teste");
        _otpSender.Setup(s => s.SendAsync(It.IsAny<string>(), It.IsAny<string>())).Returns(Task.CompletedTask);
        _service = new OtpService(_otpRepository.Object, _userRepository.Object, _categoryRepository.Object,
            _tokenService.Object, _otpSender.Object, _configuration);
    }

    private static string Hash(string code) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(code)));

    [Fact]
    public async Task Requisicao_gera_codigo_hash_com_expiracao_e_devcode()
    {
        OtpCode? captured = null;
        _otpRepository.Setup(r => r.AddAsync(Capture.In(new List<OtpCode>()))).Callback<OtpCode>(o => captured = o);
        _otpRepository.Setup(r => r.GetLatestByPhoneAsync(It.IsAny<string>())).ReturnsAsync((OtpCode?)null);

        var response = await _service.RequestOtpAsync("(11) 98765-4321");

        response.DevCode.Should().NotBeNullOrWhiteSpace().And.HaveLength(6);
        response.ResendAllowedInSeconds.Should().Be(45);
        captured!.Phone.Should().Be("11987654321");
        captured.CodeHash.Should().Be(Hash(response.DevCode!));
        captured.ExpiresAt.Should().BeAfter(DateTime.UtcNow.AddMinutes(4));
        _otpSender.Verify(s => s.SendAsync("11987654321", response.DevCode!), Times.Once);
    }

    [Fact]
    public async Task Requisicao_dentro_da_janela_de_reenvio_lanca_429()
    {
        _otpRepository.Setup(r => r.GetLatestByPhoneAsync(It.IsAny<string>()))
            .ReturnsAsync(new OtpCode { Phone = "11987654321", CreatedAt = DateTime.UtcNow.AddSeconds(-10) });

        var act = () => _service.RequestOtpAsync("11987654321");

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(429);
    }

    [Fact]
    public async Task Verificacao_com_codigo_correto_cria_usuario_e_clona_categorias()
    {
        var otp = new OtpCode
        {
            Phone = "11987654321",
            CodeHash = Hash("849201"),
            ExpiresAt = DateTime.UtcNow.AddMinutes(4),
            CreatedAt = DateTime.UtcNow
        };
        _otpRepository.Setup(r => r.GetLatestByPhoneAsync("11987654321")).ReturnsAsync(otp);
        _userRepository.Setup(r => r.GetByPhoneAsync("11987654321")).ReturnsAsync((User?)null);
        _userRepository.Setup(r => r.AddAsync(It.IsAny<User>())).Callback<User>(u => u.Id = 5).Returns(Task.CompletedTask);

        var response = await _service.VerifyOtpAsync(new VerifyOtpRequest("11987654321", "849201"));

        response.Token.Should().Be("token-teste");
        response.User.Email.Should().Contain("@wa.conektafinance.com");
        otp.ConsumedAt.Should().NotBeNull();
        _categoryRepository.Verify(r => r.AddRangeAsync(It.IsAny<IEnumerable<Category>>()), Times.Once);
    }

    [Fact]
    public async Task Verificacao_com_usuario_existente_nao_cria_novo()
    {
        var otp = new OtpCode { Phone = "11987654321", CodeHash = Hash("849201"), ExpiresAt = DateTime.UtcNow.AddMinutes(4) };
        _otpRepository.Setup(r => r.GetLatestByPhoneAsync("11987654321")).ReturnsAsync(otp);
        _userRepository.Setup(r => r.GetByPhoneAsync("11987654321"))
            .ReturnsAsync(new User { Id = 7, Email = "existente@teste.com", Phone = "11987654321", FullName = "Existente" });

        var response = await _service.VerifyOtpAsync(new VerifyOtpRequest("11987654321", "849201"));

        response.User.Id.Should().Be(7);
        _userRepository.Verify(r => r.AddAsync(It.IsAny<User>()), Times.Never);
    }

    [Fact]
    public async Task Verificacao_com_codigo_errado_incrementa_tentativa_e_lanca_401()
    {
        var otp = new OtpCode { Phone = "11987654321", CodeHash = Hash("849201"), ExpiresAt = DateTime.UtcNow.AddMinutes(4) };
        _otpRepository.Setup(r => r.GetLatestByPhoneAsync("11987654321")).ReturnsAsync(otp);

        var act = () => _service.VerifyOtpAsync(new VerifyOtpRequest("11987654321", "000000"));

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(401);
        otp.Attempts.Should().Be(1);
    }

    [Fact]
    public async Task Verificacao_excedendo_tentativas_lanca_429()
    {
        var otp = new OtpCode { Phone = "11987654321", CodeHash = Hash("849201"), ExpiresAt = DateTime.UtcNow.AddMinutes(4), Attempts = 2 };
        _otpRepository.Setup(r => r.GetLatestByPhoneAsync("11987654321")).ReturnsAsync(otp);

        var act = () => _service.VerifyOtpAsync(new VerifyOtpRequest("11987654321", "000000"));

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(429);
    }

    [Fact]
    public async Task Verificacao_com_codigo_expirado_lanca_400()
    {
        var otp = new OtpCode { Phone = "11987654321", CodeHash = Hash("849201"), ExpiresAt = DateTime.UtcNow.AddMinutes(-1) };
        _otpRepository.Setup(r => r.GetLatestByPhoneAsync("11987654321")).ReturnsAsync(otp);

        var act = () => _service.VerifyOtpAsync(new VerifyOtpRequest("11987654321", "849201"));

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(400);
    }

    [Fact]
    public async Task Telefone_invalido_lanca_400()
    {
        var act = () => _service.RequestOtpAsync("123");
        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(400);
    }
}
