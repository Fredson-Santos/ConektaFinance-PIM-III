using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using PIM_III_Backend.Application.Dtos;
using Xunit;

namespace PIM_III_Backend.Tests.Integration;

public class AdminFlowTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    private static readonly System.Text.Json.JsonSerializerOptions Json = TestJson.Options;
    private readonly HttpClient _client = factory.CreateClient();

    private HttpClient Authorized(string token)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    private async Task<AuthResponse> LoginAdminAsync()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest(CustomWebApplicationFactory.AdminEmail, CustomWebApplicationFactory.AdminPassword));
        return (await response.Content.ReadFromJsonAsync<AuthResponse>(Json))!;
    }

    private async Task<(AuthResponse Auth, string Email)> RegisterUserAsync(string name = "Cliente Comum")
    {
        var email = $"{Guid.NewGuid():N}@conekta.teste";
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest(name, email, "SenhaForte@123", null, null));
        return ((await response.Content.ReadFromJsonAsync<AuthResponse>(Json))!, email);
    }

    [Fact]
    public async Task Admin_configurado_por_ambiente_recebe_perfil_admin()
    {
        var auth = await LoginAdminAsync();

        auth.User.AccountType.Should().Be("Admin");
    }

    [Fact]
    public async Task Usuario_comum_recebe_403_nos_endpoints_administrativos()
    {
        var (auth, _) = await RegisterUserAsync();
        var client = Authorized(auth.Token);

        (await client.GetAsync("/api/v1/admin/metrics")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await client.GetAsync("/api/v1/admin/users")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await client.PatchAsJsonAsync($"/api/v1/admin/users/{auth.User.Id}/status", new UpdateUserStatusRequest(false)))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Metricas_contam_usuarios_e_lancamentos_do_mes()
    {
        var (user, _) = await RegisterUserAsync();
        var userClient = Authorized(user.Token);
        var categories = await (await userClient.GetAsync("/api/v1/categories?kind=expense")).Content
            .ReadFromJsonAsync<List<CategoryResponse>>(Json);
        await userClient.PostAsJsonAsync("/api/v1/transactions", new
        {
            type = "expense",
            categoryId = categories!.First().Id,
            description = "Mercado",
            value = 80m,
            transactionDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            paymentMethod = "pix"
        });
        var admin = Authorized((await LoginAdminAsync()).Token);

        var metrics = await (await admin.GetAsync("/api/v1/admin/metrics")).Content
            .ReadFromJsonAsync<AdminMetricsResponse>(Json);

        metrics!.TotalUsers.Should().BeGreaterThanOrEqualTo(3); // demo + admin + usuario do teste
        metrics.NewUsersThisMonth.Should().BeGreaterThanOrEqualTo(1);
        metrics.TransactionsThisMonth.Should().BeGreaterThanOrEqualTo(1);
        metrics.ActiveUsersLast30Days.Should().BeGreaterThanOrEqualTo(1);
    }

    [Fact]
    public async Task Lista_de_usuarios_pagina_e_filtra_por_busca_sem_expor_senha()
    {
        var (_, email) = await RegisterUserAsync("Beatriz Pesquisavel");
        var admin = Authorized((await LoginAdminAsync()).Token);

        var response = await admin.GetAsync("/api/v1/admin/users?search=pesquisavel&page=1&pageSize=5");
        var body = await response.Content.ReadAsStringAsync();
        var list = await response.Content.ReadFromJsonAsync<AdminUserListResponse>(Json);

        list!.TotalItems.Should().Be(1);
        list.Items.Should().ContainSingle().Which.Email.Should().Be(email);
        body.Should().NotContainEquivalentOf("password");
    }

    [Fact]
    public async Task Conta_desativada_nao_autentica_e_volta_a_autenticar_ao_reativar()
    {
        var (user, email) = await RegisterUserAsync();
        var adminAuth = await LoginAdminAsync();
        var admin = Authorized(adminAuth.Token);

        var desativar = await admin.PatchAsJsonAsync($"/api/v1/admin/users/{user.User.Id}/status", new UpdateUserStatusRequest(false));
        var bloqueado = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(email, "SenhaForte@123"));
        await admin.PatchAsJsonAsync($"/api/v1/admin/users/{user.User.Id}/status", new UpdateUserStatusRequest(true));
        var liberado = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(email, "SenhaForte@123"));

        desativar.StatusCode.Should().Be(HttpStatusCode.OK);
        (await desativar.Content.ReadFromJsonAsync<AdminUserResponse>(Json))!.IsActive.Should().BeFalse();
        bloqueado.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        liberado.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Admin_nao_pode_desativar_a_propria_conta()
    {
        var adminAuth = await LoginAdminAsync();
        var admin = Authorized(adminAuth.Token);

        var response = await admin.PatchAsJsonAsync($"/api/v1/admin/users/{adminAuth.User.Id}/status", new UpdateUserStatusRequest(false));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Alterar_status_de_usuario_inexistente_retorna_404()
    {
        var admin = Authorized((await LoginAdminAsync()).Token);

        var response = await admin.PatchAsJsonAsync("/api/v1/admin/users/999999/status", new UpdateUserStatusRequest(false));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
