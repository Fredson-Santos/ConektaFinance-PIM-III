using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Services;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Infrastructure.Persistence;
using Xunit;

namespace PIM_III_Backend.Tests.Integration;

/// <summary>
/// Captura os envios do canal WhatsApp sem tocar na Evolution API real.
/// </summary>
public sealed class FakeEvolutionClient : IEvolutionClient
{
    public bool IsConfigured => true;

    public List<(string Phone, string Text)> Sent { get; } = [];

    public string? MediaBase64 { get; set; } = Convert.ToBase64String("imagem-de-teste"u8);

    public Task SendTextAsync(string phone, string text, CancellationToken cancellationToken = default)
    {
        Sent.Add((phone, text));
        return Task.CompletedTask;
    }

    public Task<string?> DownloadMediaBase64Async(string remoteJid, string messageId, bool fromMe,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(MediaBase64);
}

/// <summary>
/// Fabrica do canal WhatsApp: configura o token do webhook e troca o cliente
/// da Evolution por um fake que registra as respostas enviadas.
/// </summary>
public class WhatsAppWebhookFactory : CustomWebApplicationFactory
{
    public FakeEvolutionClient Evolution { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        builder.UseSetting("Evolution:WebhookToken", "token-teste");
        builder.UseSetting("RateLimit:WebhookPermitLimit", "10000");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IEvolutionClient>();
            services.AddSingleton<IEvolutionClient>(Evolution);
        });
    }
}

public class WhatsAppWebhookFlowTests : IClassFixture<WhatsAppWebhookFactory>
{
    private static readonly JsonSerializerOptions Json = TestJson.Options;
    private readonly WhatsAppWebhookFactory _factory;

    public WhatsAppWebhookFlowTests(WhatsAppWebhookFactory factory) => _factory = factory;

    private static string UniquePhone() => $"11{Random.Shared.Next(100000000, 999999999)}";

    private async Task<HttpClient> CreateUserClientAsync(string phone)
    {
        var client = _factory.CreateClient();
        var register = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest("Usuario Zap", $"{Guid.NewGuid():N}@conekta.teste", "SenhaForte@123", phone, null));
        var auth = await register.Content.ReadFromJsonAsync<AuthResponse>(Json);
        var authorized = _factory.CreateClient();
        authorized.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
        return authorized;
    }

    private static object TextPayload(string text, string phone, string? id = null, bool fromMe = false,
        string? remoteJid = null, long? timestampSeconds = null) => new
    {
        @event = "messages.upsert",
        instance = "conekta-teste",
        data = new
        {
            key = new
            {
                remoteJid = remoteJid ?? $"55{phone}@s.whatsapp.net",
                fromMe,
                id = id ?? $"MSG-{Guid.NewGuid():N}"
            },
            pushName = "Usuario Zap",
            messageType = "conversation",
            message = new { conversation = text },
            messageTimestamp = timestampSeconds ?? DateTimeOffset.UtcNow.ToUnixTimeSeconds()
        }
    };

    private static object ImagePayload(string? caption, string phone) => new
    {
        @event = "messages.upsert",
        instance = "conekta-teste",
        data = new
        {
            key = new { remoteJid = $"55{phone}@s.whatsapp.net", fromMe = false, id = $"IMG-{Guid.NewGuid():N}" },
            pushName = "Usuario Zap",
            messageType = "imageMessage",
            message = new { imageMessage = new { caption, mimetype = "image/jpeg" } },
            messageTimestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
        }
    };

    private async Task<HttpResponseMessage> PostWebhookAsync(object payload, bool withToken = true)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/webhooks/whatsapp")
        {
            Content = JsonContent.Create(payload)
        };
        if (withToken)
            request.Headers.TryAddWithoutValidation("apikey", "token-teste");
        return await _factory.CreateClient().SendAsync(request);
    }

    [Fact]
    public async Task Texto_do_usuario_gera_resposta_do_agente_no_whatsapp()
    {
        _factory.Evolution.Sent.Clear();
        var phone = UniquePhone();
        var client = await CreateUserClientAsync(phone);
        var categories = await (await client.GetAsync("/api/v1/categories?kind=expense")).Content
            .ReadFromJsonAsync<List<CategoryResponse>>(Json);
        await client.PostAsJsonAsync("/api/v1/transactions", new
        {
            type = "expense",
            categoryId = categories!.First().Id,
            description = "Mercado",
            value = 250m,
            transactionDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            paymentMethod = "pix"
        });

        var response = await PostWebhookAsync(TextPayload("Me de um resumo do mes", phone));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        _factory.Evolution.Sent.Should().ContainSingle();
        _factory.Evolution.Sent[0].Phone.Should().Be(phone);
        _factory.Evolution.Sent[0].Text.Should().Contain("R$ 250,00");
    }

    [Fact]
    public async Task Gasto_por_whatsapp_gera_rascunho_e_confirmar_grava_transacao()
    {
        _factory.Evolution.Sent.Clear();
        var phone = UniquePhone();
        var client = await CreateUserClientAsync(phone);

        var draft = await PostWebhookAsync(TextPayload("Registrar um gasto de R$ 45 no uber", phone));
        draft.StatusCode.Should().Be(HttpStatusCode.OK);
        _factory.Evolution.Sent.Should().Contain(s => s.Text.Contains("confirmar"));

        var confirm = await PostWebhookAsync(TextPayload("confirmar", phone));
        confirm.StatusCode.Should().Be(HttpStatusCode.OK);
        _factory.Evolution.Sent.Should().Contain(s => s.Text.Contains("Lancamento registrado"));

        var list = await (await client.GetAsync("/api/v1/transactions?page=1&pageSize=50")).Content
            .ReadFromJsonAsync<TransactionListResponse>(Json);
        list!.Items.Should().Contain(t => t.Value == 45m && t.Category.Name == "Transporte");
    }

    [Fact]
    public async Task Cancelar_descarta_o_rascunho_e_nao_grava_transacao()
    {
        _factory.Evolution.Sent.Clear();
        var phone = UniquePhone();
        var client = await CreateUserClientAsync(phone);

        await PostWebhookAsync(TextPayload("Registrar um gasto de R$ 66 no mercado", phone));
        var cancel = await PostWebhookAsync(TextPayload("cancelar", phone));
        cancel.StatusCode.Should().Be(HttpStatusCode.OK);
        _factory.Evolution.Sent.Should().Contain(s => s.Text.Contains("Lancamento cancelado"));

        // Nao ha mais rascunho pendente: o confirmar cai na resposta estatica.
        await PostWebhookAsync(TextPayload("confirmar", phone));
        _factory.Evolution.Sent.Should().Contain(s => s.Text.Contains("aguardando confirmacao"));

        var list = await (await client.GetAsync("/api/v1/transactions?page=1&pageSize=50")).Content
            .ReadFromJsonAsync<TransactionListResponse>(Json);
        list!.Items.Should().NotContain(t => t.Value == 66m);
    }

    [Fact]
    public async Task Webhook_sem_chave_retorna_401()
    {
        _factory.Evolution.Sent.Clear();
        var response = await PostWebhookAsync(TextPayload("oi", UniquePhone()), withToken: false);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        _factory.Evolution.Sent.Should().BeEmpty();
    }

    [Fact]
    public async Task Mensagem_do_proprio_numero_e_ignorada()
    {
        _factory.Evolution.Sent.Clear();
        var phone = UniquePhone();
        await CreateUserClientAsync(phone);

        var response = await PostWebhookAsync(TextPayload("oi", phone, fromMe: true));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        _factory.Evolution.Sent.Should().BeEmpty();
    }

    [Fact]
    public async Task Mensagem_de_grupo_e_ignorada()
    {
        _factory.Evolution.Sent.Clear();
        var response = await PostWebhookAsync(TextPayload("oi", UniquePhone(),
            remoteJid: "5511999999999-159159@g.us"));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        _factory.Evolution.Sent.Should().BeEmpty();
    }

    [Fact]
    public async Task Numero_nao_vinculado_fica_em_silencio()
    {
        _factory.Evolution.Sent.Clear();
        var response = await PostWebhookAsync(TextPayload("oi", UniquePhone()));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        _factory.Evolution.Sent.Should().BeEmpty();
    }

    [Fact]
    public async Task Reentrega_do_mesmo_evento_responde_apenas_uma_vez()
    {
        _factory.Evolution.Sent.Clear();
        var phone = UniquePhone();
        await CreateUserClientAsync(phone);
        var id = $"MSG-{Guid.NewGuid():N}";

        var first = await PostWebhookAsync(TextPayload("Me de um resumo do mes", phone, id));
        var second = await PostWebhookAsync(TextPayload("Me de um resumo do mes", phone, id));

        first.StatusCode.Should().Be(HttpStatusCode.OK);
        second.StatusCode.Should().Be(HttpStatusCode.OK);
        _factory.Evolution.Sent.Should().HaveCount(1);
    }

    [Fact]
    public async Task Mensagem_antiga_e_ignorada()
    {
        _factory.Evolution.Sent.Clear();
        var phone = UniquePhone();
        await CreateUserClientAsync(phone);
        var old = DateTimeOffset.UtcNow.AddDays(-2).ToUnixTimeSeconds();

        var response = await PostWebhookAsync(TextPayload("oi", phone, timestampSeconds: old));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        _factory.Evolution.Sent.Should().BeEmpty();
    }

    [Fact]
    public async Task Foto_com_legenda_vira_mensagem_do_agente_com_imagem_e_rascunho()
    {
        _factory.Evolution.Sent.Clear();
        var phone = UniquePhone();
        var client = await CreateUserClientAsync(phone);

        var response = await PostWebhookAsync(ImagePayload("Registrar um gasto de R$ 30 no uber", phone));
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        _factory.Evolution.Sent.Should().Contain(s => s.Text.Contains("confirmar"));

        var history = await (await client.GetAsync("/api/v1/copilot/history")).Content
            .ReadFromJsonAsync<CopilotHistoryResponse>(Json);
        history!.Items.Should().BeEmpty(); // Isolamento: mensagens do WhatsApp nao aparecem no chat Web

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var zapMessages = await db.ChatMessages
                .Where(m => m.Channel == ChatChannel.WhatsApp)
                .ToListAsync();
            zapMessages.Should().Contain(m => m.ImageUrl != null);
        }

        var confirm = await PostWebhookAsync(TextPayload("confirmar", phone));
        confirm.StatusCode.Should().Be(HttpStatusCode.OK);

        var list = await (await client.GetAsync("/api/v1/transactions?page=1&pageSize=50")).Content
            .ReadFromJsonAsync<TransactionListResponse>(Json);
        list!.Items.Should().Contain(t => t.Value == 30m && t.Category.Name == "Transporte");
    }
}
