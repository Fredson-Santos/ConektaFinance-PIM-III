using System.Net;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using PIM_III_Backend.Application.Services;
using PIM_III_Backend.Infrastructure.Messaging;

namespace PIM_III_Backend.Tests.Unit.Messaging;

public class EvolutionClientTests
{
    private sealed class RecordingHandler(Func<int, HttpStatusCode> statuses, Func<int, string> bodies)
        : HttpMessageHandler
    {
        public List<HttpRequestMessage> Requests { get; } = [];

        public List<string> Bodies { get; } = [];

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            Requests.Add(request);
            Bodies.Add(request.Content is null ? string.Empty
                : await request.Content.ReadAsStringAsync(cancellationToken));
            var index = Requests.Count - 1;
            return new HttpResponseMessage(statuses(index))
            {
                Content = new StringContent(bodies(index), Encoding.UTF8, "application/json")
            };
        }
    }

    private (EvolutionClient Client, RecordingHandler Handler) CreateClient(
        bool configured = true, HttpStatusCode status = HttpStatusCode.OK, string body = "{}")
    {
        var settings = new Dictionary<string, string?>
        {
            ["Evolution:BaseUrl"] = "http://evolution.local",
            ["Evolution:ApiKey"] = "chave-teste",
            ["Evolution:Instance"] = "conekta",
            ["Evolution:SendDelayMs"] = "0"
        };
        if (!configured)
            settings["Evolution:BaseUrl"] = "";
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(settings).Build();
        var handler = new RecordingHandler(_ => status, _ => body);
        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(() => new HttpClient(handler));
        return (new EvolutionClient(factory.Object, configuration,
            Mock.Of<ILogger<EvolutionClient>>()), handler);
    }

    [Fact]
    public void IsConfigured_reflete_as_configuracoes()
    {
        CreateClient().Client.IsConfigured.Should().BeTrue();
        CreateClient(configured: false).Client.IsConfigured.Should().BeFalse();
    }

    [Fact]
    public async Task SendTextAsync_envia_post_com_numero_55_apikey_e_texto()
    {
        var (client, handler) = CreateClient(body: """{"key":{"id":"ABC"}}""");

        await client.SendTextAsync("11999999999", "Oi, tudo bem?");

        var request = handler.Requests.Should().ContainSingle().Subject;
        request.Method.Should().Be(HttpMethod.Post);
        request.RequestUri!.ToString().Should().Be("http://evolution.local/message/sendText/conekta");
        request.Headers.GetValues("apikey").Should().Equal("chave-teste");
        handler.Bodies[0].Should().Contain("\"number\":\"5511999999999\"")
            .And.Contain("\"text\":\"Oi, tudo bem?\"")
            .And.Contain("\"delay\":0");
    }

    [Fact]
    public async Task SendTextAsync_sem_configuracao_nao_faz_requisicao()
    {
        var (client, handler) = CreateClient(configured: false);

        await client.SendTextAsync("11999999999", "Oi");

        handler.Requests.Should().BeEmpty();
    }

    [Fact]
    public async Task DownloadMediaBase64Async_envia_a_chave_da_mensagem_e_le_base64_na_raiz()
    {
        var (client, handler) = CreateClient(body: """{"base64":"QUJDRA=="}""");

        var media = await client.DownloadMediaBase64Async("5511999999999@s.whatsapp.net", "MSG-1", fromMe: false);

        media.Should().Be("QUJDRA==");
        var request = handler.Requests.Should().ContainSingle().Subject;
        request.RequestUri!.ToString().Should()
            .Be("http://evolution.local/chat/getBase64FromMediaMessage/conekta");
        handler.Bodies[0].Should()
            .Contain("\"key\":{\"remoteJid\":\"5511999999999@s.whatsapp.net\",\"id\":\"MSG-1\",\"fromMe\":false}")
            .And.Contain("\"convertToMp4\":false");
    }

    [Fact]
    public async Task DownloadMediaBase64Async_le_base64_aninhado_em_data()
    {
        var (client, _) = CreateClient(body: """{"data":{"base64":"QUJDRA=="}}""");

        var media = await client.DownloadMediaBase64Async("5511999999999@s.whatsapp.net", "MSG-1", false);

        media.Should().Be("QUJDRA==");
    }

    [Fact]
    public async Task DownloadMediaBase64Async_sem_base64_retorna_null()
    {
        var (client, _) = CreateClient(body: """{"ok":true}""");

        var media = await client.DownloadMediaBase64Async("5511999999999@s.whatsapp.net", "MSG-1", false);

        media.Should().BeNull();
    }

    [Fact]
    public async Task Erro_da_evolution_lanca_excecao()
    {
        var (client, _) = CreateClient(status: HttpStatusCode.InternalServerError, body: """{"error":"falhou"}""");

        var act = () => client.SendTextAsync("11999999999", "Oi");

        await act.Should().ThrowAsync<InvalidOperationException>();
    }
}
