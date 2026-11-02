using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Moq;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Exceptions;
using PIM_III_Backend.Application.Services;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Tests.Unit.Services;

public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly Mock<ICategoryRepository> _categoryRepository = new();
    private readonly Mock<ITokenService> _tokenService = new();
    private readonly AuthService _service;

    public AuthServiceTests()
    {
        _tokenService.Setup(t => t.GenerateToken(It.IsAny<User>())).Returns("token-teste");
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Demo:Email"] = "demo@conektafinance.com"
        }).Build();
        _service = new AuthService(_userRepository.Object, _categoryRepository.Object, _tokenService.Object, configuration);
    }

    [Fact]
    public async Task Registro_clona_as_categorias_padrao_para_o_novo_usuario()
    {
        var captured = new List<IEnumerable<Category>>();
        _categoryRepository
            .Setup(r => r.AddRangeAsync(Capture.In(captured)))
            .Returns(Task.CompletedTask);
        _userRepository.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);
        _userRepository.Setup(r => r.AddAsync(It.IsAny<User>()))
            .Callback<User>(u => u.Id = 99)
            .Returns(Task.CompletedTask);

        await _service.RegisterAsync(new RegisterRequest("Maria Souza", "maria@teste.com", "SenhaForte@123", null, null));

        captured.Should().HaveCount(1);
        captured[0].Should().HaveCount(13);
        captured[0].Should().OnlyContain(c => c.UserId == 99);
    }

    [Fact]
    public async Task Registro_com_email_duplicado_lanca_conflito()
    {
        _userRepository.Setup(r => r.GetByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync(new User { Email = "maria@teste.com" });

        var act = () => _service.RegisterAsync(new RegisterRequest("Maria", "maria@teste.com", "SenhaForte@123", null, null));

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(409);
    }

    [Fact]
    public async Task Login_com_senha_incorreta_lanca_nao_autorizado()
    {
        _userRepository.Setup(r => r.GetByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync(new User { Email = "maria@teste.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("SenhaCerta@123") });

        var act = () => _service.LoginAsync(new LoginRequest("maria@teste.com", "SenhaErrada@999"));

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(401);
        exception.Which.Title.Should().NotContain("hash");
    }

    [Fact]
    public async Task Login_valido_gera_token()
    {
        _userRepository.Setup(r => r.GetByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync(new User { Id = 1, Email = "maria@teste.com", FullName = "Maria", PasswordHash = BCrypt.Net.BCrypt.HashPassword("SenhaCerta@123") });

        var response = await _service.LoginAsync(new LoginRequest("maria@teste.com", "SenhaCerta@123"));

        response.Token.Should().Be("token-teste");
        response.User.Email.Should().Be("maria@teste.com");
    }

    [Fact]
    public async Task Login_demo_retorna_token_da_conta_configurada()
    {
        _userRepository.Setup(r => r.GetByEmailAsync("demo@conektafinance.com"))
            .ReturnsAsync(new User { Id = 3, Email = "demo@conektafinance.com", FullName = "Usuario Demo" });

        var response = await _service.DemoLoginAsync();

        response.Token.Should().Be("token-teste");
        response.User.Email.Should().Be("demo@conektafinance.com");
    }

    [Fact]
    public async Task Login_demo_sem_conta_configurada_lanca_nao_encontrado()
    {
        _userRepository.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);

        var act = () => _service.DemoLoginAsync();

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(404);
    }
}
