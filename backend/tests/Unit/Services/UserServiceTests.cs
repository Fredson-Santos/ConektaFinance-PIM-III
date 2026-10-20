using FluentAssertions;
using Moq;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Exceptions;
using PIM_III_Backend.Application.Services;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Tests.Unit.Services;

public class UserServiceTests
{
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly Mock<IAvatarStorage> _avatarStorage = new();
    private readonly UserService _service;

    public UserServiceTests() =>
        _service = new UserService(_userRepository.Object, _avatarStorage.Object);

    private void SetupUser(User user) =>
        _userRepository.Setup(r => r.GetByIdAsync(user.Id)).ReturnsAsync(user);

    [Fact]
    public async Task Atualizar_perfil_altera_apenas_campos_enviados()
    {
        var user = new User { Id = 1, FullName = "Nome Antigo", DisplayName = "Fred", Occupation = "Analista" };
        SetupUser(user);

        var response = await _service.UpdateProfileAsync(1,
            new UpdateProfileRequest("Nome Novo", null, "11987654321", null, null));

        response.FullName.Should().Be("Nome Novo");
        response.DisplayName.Should().Be("Fred");
        user.Phone.Should().Be("11987654321");
        user.Occupation.Should().Be("Analista");
    }

    [Fact]
    public async Task Trocar_senha_com_atual_incorreta_lanca_400()
    {
        var user = new User { Id = 1, PasswordHash = BCrypt.Net.BCrypt.HashPassword("SenhaAtual@123") };
        SetupUser(user);

        var act = () => _service.ChangePasswordAsync(1, new ChangePasswordRequest("Errada@123", "NovaSenha@456"));

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(400);
    }

    [Fact]
    public async Task Trocar_senha_valida_atualiza_hash()
    {
        var user = new User { Id = 1, PasswordHash = BCrypt.Net.BCrypt.HashPassword("SenhaAtual@123") };
        SetupUser(user);

        await _service.ChangePasswordAsync(1, new ChangePasswordRequest("SenhaAtual@123", "NovaSenha@456"));

        BCrypt.Net.BCrypt.Verify("NovaSenha@456", user.PasswordHash).Should().BeTrue();
        _userRepository.Verify(r => r.UpdateAsync(user), Times.Once);
    }

    [Fact]
    public async Task Avatar_com_tipo_invalido_lanca_400()
    {
        SetupUser(new User { Id = 1 });

        var act = () => _service.UpdateAvatarAsync(1, new MemoryStream([1, 2, 3]), "image/gif", 100);

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(400);
    }

    [Fact]
    public async Task Avatar_maior_que_2mb_lanca_400()
    {
        SetupUser(new User { Id = 1 });

        var act = () => _service.UpdateAvatarAsync(1, new MemoryStream(), "image/png", 3 * 1024 * 1024);

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(400);
    }

    [Fact]
    public async Task Avatar_valido_substitui_o_anterior()
    {
        var user = new User { Id = 1, AvatarUrl = "/uploads/avatars/avatar_1_antigo.png" };
        SetupUser(user);
        _avatarStorage.Setup(s => s.SaveAsync(1, ".png", It.IsAny<Stream>())).ReturnsAsync("/uploads/avatars/avatar_1_novo.png");
        _avatarStorage.Setup(s => s.DeleteAsync(It.IsAny<string?>())).Returns(Task.CompletedTask);

        var response = await _service.UpdateAvatarAsync(1, new MemoryStream([1, 2, 3]), "image/png", 3);

        response.AvatarUrl.Should().Be("/uploads/avatars/avatar_1_novo.png");
        user.AvatarUrl.Should().Be("/uploads/avatars/avatar_1_novo.png");
        _avatarStorage.Verify(s => s.DeleteAsync("/uploads/avatars/avatar_1_antigo.png"), Times.Once);
    }

    [Fact]
    public async Task Preferencias_com_dia_de_ciculo_invalido_lanca_400()
    {
        SetupUser(new User { Id = 1, CycleStartDay = 1 });

        var act = () => _service.UpdatePreferencesAsync(1, new UpdatePreferencesRequest(null, null, 30));

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(400);
    }

    [Fact]
    public async Task Preferencias_atualizam_teto_e_moeda()
    {
        var user = new User { Id = 1, MonthlyCeiling = 1000m, Currency = "BRL", CycleStartDay = 1 };
        SetupUser(user);

        var response = await _service.UpdatePreferencesAsync(1, new UpdatePreferencesRequest(8380m, "brl", 5));

        response.MonthlyCeiling.Should().Be(8380m);
        response.Currency.Should().Be("BRL");
        response.CycleStartDay.Should().Be(5);
    }
}
