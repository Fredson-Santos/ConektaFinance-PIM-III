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

    /// <summary>
    /// Telefone ficticio para os fluxos de OTP: o DDD "00" nao existe no Brasil,
    /// portanto o numero nunca corresponde a um WhatsApp real. Mesmo que um
    /// sender real venha a ser resolvido por engano no host de teste, nenhuma
    /// pessoa de verdade recebe o codigo (incidente dos envios indevidos).
    /// </summary>
    private static string FictionalPhone() => $"00{Random.Shared.Next(100000000, 999999999)}";

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

    [Fact]
    public async Task Otp_request_retorna_devcode_e_verify_autentica_por_telefone()
    {
        var phone = FictionalPhone();

        var requestResponse = await _client.PostAsJsonAsync("/api/v1/auth/otp/request", new { phone });
        requestResponse.StatusCode.Should().Be(HttpStatusCode.Accepted);
        var otp = await requestResponse.Content.ReadFromJsonAsync<OtpRequestResponse>();
        otp!.DevCode.Should().NotBeNullOrWhiteSpace();

        var verifyResponse = await _client.PostAsJsonAsync("/api/v1/auth/otp/verify",
            new { phone, code = otp.DevCode });
        verifyResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var auth = await verifyResponse.Content.ReadFromJsonAsync<AuthResponse>();
        auth!.Token.Should().NotBeNullOrWhiteSpace();
        auth.User.Phone.Should().Be(phone);
    }

    [Fact]
    public async Task Otp_reenvio_dentro_da_janela_retorna_429()
    {
        var phone = FictionalPhone();

        var first = await _client.PostAsJsonAsync("/api/v1/auth/otp/request", new { phone });
        first.StatusCode.Should().Be(HttpStatusCode.Accepted);

        var second = await _client.PostAsJsonAsync("/api/v1/auth/otp/request", new { phone });
        second.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
    }

    [Fact]
    public async Task Otp_codigo_invalido_retorna_401()
    {
        var phone = FictionalPhone();
        await _client.PostAsJsonAsync("/api/v1/auth/otp/request", new { phone });

        var response = await _client.PostAsJsonAsync("/api/v1/auth/otp/verify", new { phone, code = "000000" });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Acesso_demo_retorna_token_da_conta_de_demonstracao()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/demo", new { });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();
        auth!.Token.Should().NotBeNullOrWhiteSpace();
        auth.User.Email.Should().Be("demo@conektafinance.com");
    }
}
