using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Domain.Enums;
using Xunit;

namespace PIM_III_Backend.Tests.Integration;

public class CategoriesFlowTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    private async Task<HttpClient> CreateUserClientAsync()
    {
        var email = $"{Guid.NewGuid():N}@conekta.teste";
        var register = await _client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest("Usuario Teste", email, "SenhaForte@123", null, null));
        var auth = await register.Content.ReadFromJsonAsync<AuthResponse>(TestJson.Options);
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
        return client;
    }

    [Fact]
    public async Task Endpoint_protegido_sem_token_retorna_401_com_problemdetails()
    {
        var response = await _client.GetAsync("/api/v1/categories");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        response.Content.Headers.ContentType!.ToString().Should().Contain("application/problem+json");
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Sessao invalida ou expirada");
    }

    [Fact]
    public async Task Novo_usuario_recebe_13_categorias_padrao()
    {
        var client = await CreateUserClientAsync();

        var response = await client.GetAsync("/api/v1/categories?kind=expense");
        var expenses = await response.Content.ReadFromJsonAsync<List<CategoryResponse>>(TestJson.Options);
        expenses!.Should().HaveCount(7);

        var incomes = await (await client.GetAsync("/api/v1/categories?kind=income")).Content
            .ReadFromJsonAsync<List<CategoryResponse>>(TestJson.Options);
        incomes!.Should().HaveCount(6);
    }

    [Fact]
    public async Task Criar_e_atualizar_categoria_do_proprio_usuario()
    {
        var client = await CreateUserClientAsync();

        var create = await client.PostAsJsonAsync("/api/v1/categories",
            new CreateCategoryRequest("Pets", "Pet shop e racao", "#ef4444", "Tag", CategoryKind.Expense));
        create.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await create.Content.ReadFromJsonAsync<CategoryResponse>(TestJson.Options);
        created!.Name.Should().Be("Pets");

        var duplicate = await client.PostAsJsonAsync("/api/v1/categories",
            new CreateCategoryRequest("Pets", null, "#ef4444", "Tag", CategoryKind.Expense));
        duplicate.StatusCode.Should().Be(HttpStatusCode.Conflict);

        var update = await client.PutAsJsonAsync($"/api/v1/categories/{created.Id}",
            new UpdateCategoryRequest("Pets e Cuidados", null, null, null, null));
        update.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated = await update.Content.ReadFromJsonAsync<CategoryResponse>(TestJson.Options);
        updated!.Name.Should().Be("Pets e Cuidados");

        var delete = await client.DeleteAsync($"/api/v1/categories/{created.Id}");
        delete.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Criar_categoria_com_cor_invalida_retorna_400()
    {
        var client = await CreateUserClientAsync();

        var response = await client.PostAsJsonAsync("/api/v1/categories",
            new CreateCategoryRequest("Invalida", null, "azul", "Tag", CategoryKind.Expense));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("ColorCode");
    }

    [Fact]
    public async Task Listar_com_mes_e_ano_retorna_gasto_e_teto()
    {
        var client = await CreateUserClientAsync();
        var now = DateTime.UtcNow;

        var response = await client.GetAsync($"/api/v1/categories?month={now.Month}&year={now.Year}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var categories = await response.Content.ReadFromJsonAsync<List<CategoryResponse>>(TestJson.Options);
        categories!.Where(c => c.Kind == Domain.Enums.CategoryKind.Expense)
            .Should().OnlyContain(c => c.Spent == 0m && c.Limit == 0m && c.Status == "noLimit");
        categories!.Where(c => c.Kind == Domain.Enums.CategoryKind.Income)
            .Should().OnlyContain(c => c.Spent == null && c.Limit == null && c.Status == null);
    }
}
