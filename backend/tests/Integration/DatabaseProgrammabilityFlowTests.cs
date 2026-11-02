using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Infrastructure.Persistence;
using Xunit;

namespace PIM_III_Backend.Tests.Integration;

// Valida as triggers e procedures de database/ aplicadas pela API no PostgreSQL.
public class DatabaseProgrammabilityFlowTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    private static readonly System.Text.Json.JsonSerializerOptions Json = TestJson.Options;
    private readonly HttpClient _client = factory.CreateClient();

    private async Task<(HttpClient Client, int UserId)> CreateUserClientAsync()
    {
        var email = $"{Guid.NewGuid():N}@conekta.teste";
        var register = await _client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest("Usuario Banco", email, "SenhaForte@123", null, null));
        var auth = await register.Content.ReadFromJsonAsync<AuthResponse>(Json);
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
        return (client, auth.User.Id);
    }

    private async Task<int> CategoryIdAsync(HttpClient client, string name)
    {
        var categories = await (await client.GetAsync("/api/v1/categories")).Content
            .ReadFromJsonAsync<List<CategoryResponse>>(Json);
        return categories!.First(c => c.Name == name).Id;
    }

    private async Task<T> WithDbAsync<T>(Func<AppDbContext, Task<T>> action)
    {
        using var scope = factory.Services.CreateScope();
        return await action(scope.ServiceProvider.GetRequiredService<AppDbContext>());
    }

    // Insere a despesa direto no banco, sem passar pelo AlertService da API.
    private Task InsertExpenseAsync(int userId, int categoryId, decimal value, DateTime date) =>
        WithDbAsync(db => db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO transactions (user_id, category_id, type, description, value, transaction_date,
                                      is_recurrent, status, source)
            VALUES ({userId}, {categoryId}, 0, 'Despesa via SQL', {value}, {date}, false, 0, 0)
            """));

    [Fact]
    public async Task Trigger_de_alerta_gera_alertas_de_80_e_100_por_cento_sem_duplicar()
    {
        var (client, userId) = await CreateUserClientAsync();
        var lazer = await CategoryIdAsync(client, "Lazer");
        var now = DateTime.UtcNow;
        await client.PutAsJsonAsync("/api/v1/budgets", new BudgetUpsertRequest(lazer, 500m, now.Month, now.Year));

        await InsertExpenseAsync(userId, lazer, 420m, now);
        await InsertExpenseAsync(userId, lazer, 10m, now);
        var aposAtencao = await WithDbAsync(db => db.Alerts.Where(a => a.UserId == userId).ToListAsync());

        await InsertExpenseAsync(userId, lazer, 100m, now);
        var aposExcesso = await WithDbAsync(db => db.Alerts.Where(a => a.UserId == userId).ToListAsync());

        aposAtencao.Should().ContainSingle()
            .Which.DedupKey.Should().Be($"cat:{lazer}:{now.Year}-{now.Month:D2}:limit");
        aposExcesso.Should().HaveCount(2);
        aposExcesso.Should().ContainSingle(a => a.DedupKey.EndsWith(":exceeded"))
            .Which.Title.Should().Be("Lazer acima do teto");
    }

    [Fact]
    public async Task Trigger_de_auditoria_registra_insercao_e_exclusao_de_lancamento()
    {
        var (client, userId) = await CreateUserClientAsync();
        var mercado = await CategoryIdAsync(client, "Alimentação");
        var created = await client.PostAsJsonAsync("/api/v1/transactions", new
        {
            type = "expense",
            categoryId = mercado,
            description = "Feira auditada",
            value = 75m,
            transactionDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            paymentMethod = "pix"
        });
        var transaction = await created.Content.ReadFromJsonAsync<TransactionResponse>(Json);
        await client.DeleteAsync($"/api/v1/transactions/{transaction!.Id}");

        var operacoes = await WithDbAsync(db => db.Database.SqlQuery<string>($"""
            SELECT operation || ':' || COALESCE(new_data ->> 'description', old_data ->> 'description') AS "Value"
              FROM audit_log
             WHERE table_name = 'transactions' AND record_id = {transaction.Id} AND user_id = {userId}
             ORDER BY id
            """).ToListAsync());

        operacoes.Should().Equal("INSERT:Feira auditada", "DELETE:Feira auditada");
    }

    [Fact]
    public async Task Trigger_de_updated_at_atualiza_data_em_alteracao_fora_da_api()
    {
        var (_, userId) = await CreateUserClientAsync();
        var antes = await WithDbAsync(db => db.Users.Where(u => u.Id == userId).Select(u => u.UpdatedAt).SingleAsync());

        await WithDbAsync(db => db.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE users SET occupation = 'Analista' WHERE id = {userId}"));
        var depois = await WithDbAsync(db => db.Users.Where(u => u.Id == userId).Select(u => u.UpdatedAt).SingleAsync());

        depois.Should().BeAfter(antes);
    }

    [Fact]
    public async Task Function_de_status_do_orcamento_aplica_os_limiares_do_backend()
    {
        var (client, userId) = await CreateUserClientAsync();
        var transporte = await CategoryIdAsync(client, "Transporte");
        var now = DateTime.UtcNow;
        await client.PutAsJsonAsync("/api/v1/budgets", new BudgetUpsertRequest(transporte, 100m, now.Month, now.Year));

        async Task<string> StatusAsync() => await WithDbAsync(db => db.Database.SqlQuery<string>(
            $"SELECT status AS \"Value\" FROM fn_status_orcamento({userId}, {transporte}, {now.Year}, {now.Month})")
            .SingleAsync());

        await InsertExpenseAsync(userId, transporte, 79.99m, now);
        var abaixo = await StatusAsync();
        await InsertExpenseAsync(userId, transporte, 0.01m, now);
        var oitenta = await StatusAsync();
        await InsertExpenseAsync(userId, transporte, 20m, now);
        var cem = await StatusAsync();
        await InsertExpenseAsync(userId, transporte, 0.01m, now);
        var acima = await StatusAsync();

        new[] { abaixo, oitenta, cem, acima }.Should().Equal("ok", "warn", "warn", "over");
    }
}
