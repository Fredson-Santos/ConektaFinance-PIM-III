using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Tests.Integration;
using Xunit;

namespace PIM_III_Backend.Tests.Integration;

public class TransactionsFlowTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    private static readonly JsonSerializerOptions Json = TestJson.Options;
    private readonly HttpClient _client = factory.CreateClient();

    private async Task<(HttpClient client, List<CategoryResponse> categories)> CreateUserWithCategoriesAsync()
    {
        var email = $"{Guid.NewGuid():N}@conekta.teste";
        var register = await _client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest("Usuario Transacoes", email, "SenhaForte@123", null, null));
        var auth = await register.Content.ReadFromJsonAsync<AuthResponse>(Json);
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
        var categories = await (await client.GetAsync("/api/v1/categories")).Content
            .ReadFromJsonAsync<List<CategoryResponse>>(Json);
        return (client, categories!);
    }

    private static CreateTransactionRequest NewExpense(int categoryId, decimal value, string description = "Supermercado") =>
        new(TransactionType.Expense, categoryId, description, value, DateTime.UtcNow.AddDays(-2),
            PaymentMethod.Pix, null, false);

    [Fact]
    public async Task Criar_despesa_retorna_201_com_location_e_busca_por_id()
    {
        var (client, categories) = await CreateUserWithCategoriesAsync();
        var alimentacao = categories.First(c => c.Kind == CategoryKind.Expense);

        var create = await client.PostAsJsonAsync("/api/v1/transactions",
            NewExpense(alimentacao.Id, 186.40m, "Mercado Pão de Acucar"));
        create.StatusCode.Should().Be(HttpStatusCode.Created);
        create.Headers.Location!.ToString().Should().Contain("/api/v1/transactions/");

        var created = await create.Content.ReadFromJsonAsync<TransactionResponse>(Json);
        created!.Type.Should().Be(TransactionType.Expense);
        created.Value.Should().Be(186.40m);
        created.Source.Should().Be(TransactionSource.Manual);

        var getById = await client.GetAsync($"/api/v1/transactions/{created.Id}");
        getById.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Criar_entrada_com_categoria_de_despesa_retorna_400()
    {
        var (client, categories) = await CreateUserWithCategoriesAsync();
        var alimentacao = categories.First(c => c.Kind == CategoryKind.Expense);

        var response = await client.PostAsJsonAsync("/api/v1/transactions",
            NewExpense(alimentacao.Id, 100m) with { Type = TransactionType.Income });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Listar_retorna_soma_dos_filtrados_no_cabecalho_e_meta_de_paginacao()
    {
        var (client, categories) = await CreateUserWithCategoriesAsync();
        var alimentacao = categories.First(c => c.Kind == CategoryKind.Expense);
        await client.PostAsJsonAsync("/api/v1/transactions", NewExpense(alimentacao.Id, 100m, "Uber"));
        await client.PostAsJsonAsync("/api/v1/transactions", NewExpense(alimentacao.Id, 50m, "iFood"));
        await client.PostAsJsonAsync("/api/v1/transactions",
            NewExpense(categories.First(c => c.Kind == CategoryKind.Income).Id, 500m, "Salario") with { Type = TransactionType.Income });

        var list = await client.GetAsync("/api/v1/transactions?type=expense");
        list.StatusCode.Should().Be(HttpStatusCode.OK);
        list.Headers.Contains("X-Total-Sum").Should().BeTrue();
        list.Headers.GetValues("X-Total-Sum").First().Should().Be("150.00");
        var body = await list.Content.ReadFromJsonAsync<TransactionListResponse>(Json);
        body!.Meta.TotalItems.Should().Be(2);
        body.Items.Should().OnlyContain(t => t.Type == TransactionType.Expense);

        var paged = await (await client.GetAsync("/api/v1/transactions?page=1&pageSize=1")).Content
            .ReadFromJsonAsync<TransactionListResponse>(Json);
        paged!.Meta.PageSize.Should().Be(1);
        paged.Meta.TotalPages.Should().Be(3);
    }

    [Fact]
    public async Task Buscar_por_texto_filtra_descricao()
    {
        var (client, categories) = await CreateUserWithCategoriesAsync();
        var alimentacao = categories.First(c => c.Kind == CategoryKind.Expense);
        await client.PostAsJsonAsync("/api/v1/transactions", NewExpense(alimentacao.Id, 100m, "Uber XYZ"));
        await client.PostAsJsonAsync("/api/v1/transactions", NewExpense(alimentacao.Id, 100m, "iFood ABC"));

        var search = await client.GetAsync("/api/v1/transactions?search=uber");
        var body = await search.Content.ReadFromJsonAsync<TransactionListResponse>(Json);
        body!.Items.Should().ContainSingle(t => t.Description == "Uber XYZ");
    }

    [Fact]
    public async Task Atualizar_e_excluir_lancamento_do_proprio_usuario()
    {
        var (client, categories) = await CreateUserWithCategoriesAsync();
        var alimentacao = categories.First(c => c.Kind == CategoryKind.Expense);
        var create = await client.PostAsJsonAsync("/api/v1/transactions", NewExpense(alimentacao.Id, 80m));
        var created = await create.Content.ReadFromJsonAsync<TransactionResponse>(Json);

        var update = await client.PutAsJsonAsync($"/api/v1/transactions/{created!.Id}",
            NewExpense(alimentacao.Id, 95.5m, "Mercado atualizado"));
        update.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated = await update.Content.ReadFromJsonAsync<TransactionResponse>(Json);
        updated!.Value.Should().Be(95.5m);

        var delete = await client.DeleteAsync($"/api/v1/transactions/{created.Id}");
        delete.StatusCode.Should().Be(HttpStatusCode.NoContent);
        var getById = await client.GetAsync($"/api/v1/transactions/{created.Id}");
        getById.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Lancamento_de_outro_usuario_retorna_404()
    {
        var (owner, categories) = await CreateUserWithCategoriesAsync();
        var alimentacao = categories.First(c => c.Kind == CategoryKind.Expense);
        var create = await owner.PostAsJsonAsync("/api/v1/transactions", NewExpense(alimentacao.Id, 10m));
        var created = await create.Content.ReadFromJsonAsync<TransactionResponse>(Json);

        var (other, _) = await CreateUserWithCategoriesAsync();
        var getById = await other.GetAsync($"/api/v1/transactions/{created!.Id}");
        getById.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Criar_com_valor_invalido_retorna_400()
    {
        var (client, categories) = await CreateUserWithCategoriesAsync();
        var alimentacao = categories.First(c => c.Kind == CategoryKind.Expense);

        var response = await client.PostAsJsonAsync("/api/v1/transactions",
            NewExpense(alimentacao.Id, 0m));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Value");
    }
}
