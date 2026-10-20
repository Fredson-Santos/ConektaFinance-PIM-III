using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using PIM_III_Backend.Application.Dtos;
using Xunit;

namespace PIM_III_Backend.Tests.Integration;

public class AuthFlowTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    private static RegisterRequest NewRegister() =>
        new($"Usuario {Guid.NewGuid():N}", $"{Guid.NewGuid():N}@conekta.teste", "SenhaForte@123", null, 3500m);

    [Fact]
    public async Task Registro_retorna_201_com_token_e_dados_do_usuario()
    {
        var request = NewRegister();

        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<AuthResponse>();
        body.Should().NotBeNull();
        body!.Token.Should().NotBeNullOrWhiteSpace();
        body.User.Email.Should().Be(request.Email.ToLowerInvariant());
        body.User.MonthlyCeiling.Should().Be(3500m);
    }

    [Fact]
    public async Task Registro_com_email_duplicado_retorna_409()
    {
        var request = NewRegister();
        await _client.PostAsJsonAsync("/api/v1/auth/register", request);

        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", request);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Login_com_credenciais_validas_retorna_200_com_token()
    {
        var request = NewRegister();
        await _client.PostAsJsonAsync("/api/v1/auth/register", request);

        var response = await _client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest(request.Email, "SenhaForte@123"));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<AuthResponse>();
        body!.Token.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Login_com_senha_invalida_retorna_401_com_mensagem_generica()
    {
        var request = NewRegister();
        await _client.PostAsJsonAsync("/api/v1/auth/register", request);

        var response = await _client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest(request.Email, "SenhaErrada@999"));

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Credenciais invalidas");
        content.Should().NotContain("stack");
    }

    [Fact]
    public async Task Registro_com_senha_curta_retorna_400_com_problemdetails()
    {
        var request = NewRegister() with { Password = "curta" };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Password");
    }

    [Fact]
    public async Task Health_responde_200_sem_autenticacao()
    {
        var response = await _client.GetAsync("/health");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
