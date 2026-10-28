using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using PIM_III_Backend.Application.Dtos;
using Xunit;

namespace PIM_III_Backend.Tests.Integration;

public class UsersFlowTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    private static readonly System.Text.Json.JsonSerializerOptions Json = TestJson.Options;
    private readonly HttpClient _client = factory.CreateClient();

    private async Task<HttpClient> CreateUserClientAsync(string password = "SenhaForte@123")
    {
        var email = $"{Guid.NewGuid():N}@conekta.teste";
        var register = await _client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest("Perfil Inicial", email, password, null, null));
        var auth = await register.Content.ReadFromJsonAsync<AuthResponse>(Json);
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
        return client;
    }

    [Fact]
    public async Task Perfil_retorna_dados_do_usuario_logado_e_atualiza_campos()
    {
        var client = await CreateUserClientAsync();

        var profile = await (await client.GetAsync("/api/v1/users/me")).Content
            .ReadFromJsonAsync<UserResponse>(Json);
        profile!.FullName.Should().Be("Perfil Inicial");

        var update = await client.PutAsJsonAsync("/api/v1/users/me",
            new UpdateProfileRequest("Fredson Santos", "Fred", "11987654321", "12345678900", "Desenvolvedor"));
        update.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated = await update.Content.ReadFromJsonAsync<UserResponse>(Json);
        updated!.FullName.Should().Be("Fredson Santos");
        updated.DisplayName.Should().Be("Fred");
        updated.Occupation.Should().Be("Desenvolvedor");
    }

    [Fact]
    public async Task Novo_usuario_por_otp_inicia_com_onboarding_pendente_e_conclui_pela_api()
    {
        var phone = $"00{Random.Shared.Next(100000000, 999999999)}";
        var otp = await (await _client.PostAsJsonAsync("/api/v1/auth/otp/request", new { phone })).Content
            .ReadFromJsonAsync<OtpRequestResponse>(Json);
        var auth = await (await _client.PostAsJsonAsync("/api/v1/auth/otp/verify", new { phone, code = otp!.DevCode }))
            .Content.ReadFromJsonAsync<AuthResponse>(Json);
        auth!.User.OnboardingCompleted.Should().BeFalse();

        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.Token);
        var response = await client.PutAsJsonAsync("/api/v1/users/me/onboarding",
            new CompleteOnboardingRequest("Maria Oliveira", "Maria", 3500m));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var profile = await (await client.GetAsync("/api/v1/users/me")).Content
            .ReadFromJsonAsync<UserResponse>(Json);
        profile!.OnboardingCompleted.Should().BeTrue();
        profile.FullName.Should().Be("Maria Oliveira");
        profile.DisplayName.Should().Be("Maria");
        profile.MonthlyCeiling.Should().Be(3500m);
    }

    [Fact]
    public async Task Onboarding_com_teto_zerado_ou_nome_vazio_retorna_400()
    {
        var client = await CreateUserClientAsync();

        var semTeto = await client.PutAsJsonAsync("/api/v1/users/me/onboarding",
            new CompleteOnboardingRequest("Maria Oliveira", null, 0m));
        var semNome = await client.PutAsJsonAsync("/api/v1/users/me/onboarding",
            new CompleteOnboardingRequest(" ", null, 2000m));

        semTeto.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        semNome.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Registro_com_teto_definido_dispensa_onboarding()
    {
        var register = await _client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest("Cadastro Completo", $"{Guid.NewGuid():N}@conekta.teste", "SenhaForte@123", null, 4000m));
        var auth = await register.Content.ReadFromJsonAsync<AuthResponse>(Json);

        auth!.User.OnboardingCompleted.Should().BeTrue();
    }

    [Fact]
    public async Task Troca_de_senha_permite_login_com_a_nova()
    {
        var email = $"{Guid.NewGuid():N}@conekta.teste";
        var register = await _client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest("Troca Senha", email, "SenhaForte@123", null, null));
        var auth = await register.Content.ReadFromJsonAsync<AuthResponse>(Json);
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);

        var change = await client.PutAsJsonAsync("/api/v1/users/me/password",
            new ChangePasswordRequest("SenhaForte@123", "NovaSenha@456"));
        change.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var loginAntiga = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(email, "SenhaForte@123"));
        loginAntiga.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        var loginNova = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(email, "NovaSenha@456"));
        loginNova.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Troca_de_senha_com_atual_errada_retorna_400()
    {
        var client = await CreateUserClientAsync();

        var response = await client.PutAsJsonAsync("/api/v1/users/me/password",
            new ChangePasswordRequest("Errada@000", "NovaSenha@456"));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Senha atual incorreta");
    }

    [Fact]
    public async Task Upload_de_avatar_retorna_url_publica()
    {
        var client = await CreateUserClientAsync();
        using var form = new MultipartFormDataContent();
        var png = Convert.FromBase64String(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");
        var fileContent = new ByteArrayContent(png);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        form.Add(fileContent, "file", "avatar.png");

        var response = await client.PutAsync("/api/v1/users/me/avatar", form);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var avatar = await response.Content.ReadFromJsonAsync<AvatarResponse>(Json);
        avatar!.AvatarUrl.Should().StartWith("/uploads/avatars/avatar_");
    }

    [Fact]
    public async Task Upload_de_avatar_com_tipo_invalido_retorna_400()
    {
        var client = await CreateUserClientAsync();
        using var form = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent([1, 2, 3]);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("text/plain");
        form.Add(fileContent, "file", "avatar.txt");

        var response = await client.PutAsync("/api/v1/users/me/avatar", form);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Preferencias_atualizam_teto_geral_e_ciclo()
    {
        var client = await CreateUserClientAsync();

        var update = await client.PutAsJsonAsync("/api/v1/users/me/preferences",
            new UpdatePreferencesRequest(8380m, null, 1));
        update.StatusCode.Should().Be(HttpStatusCode.OK);
        var preferences = await update.Content.ReadFromJsonAsync<PreferencesResponse>(Json);
        preferences!.MonthlyCeiling.Should().Be(8380m);
        preferences.CycleStartDay.Should().Be(1);

        var invalid = await client.PutAsJsonAsync("/api/v1/users/me/preferences",
            new UpdatePreferencesRequest(null, null, 31));
        invalid.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
