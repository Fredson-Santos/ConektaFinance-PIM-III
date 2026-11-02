using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Moq;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Exceptions;
using PIM_III_Backend.Application.Services;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Tests.Unit.Services;

public class WhatsAppChannelServiceTests
{
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly Mock<ICopilotService> _copilotService = new();
    private readonly Mock<IChatMessageRepository> _chatRepository = new();
    private readonly Mock<IEvolutionClient> _evolutionClient = new();
    private readonly WhatsAppChannelService _service;

    public WhatsAppChannelServiceTests()
    {
        _evolutionClient.SetupGet(e => e.IsConfigured).Returns(true);
        _userRepository.Setup(r => r.GetByPhoneAsync("11999999999"))
            .ReturnsAsync(new User { Id = 1, FullName = "Usuario Zap", Phone = "11999999999" });
        _service = new WhatsAppChannelService(
            _userRepository.Object, _copilotService.Object, _chatRepository.Object,
            _evolutionClient.Object, new MemoryCache(new MemoryCacheOptions()),
            Mock.Of<ILogger<WhatsAppChannelService>>());
    }

    private static string TextPayload(string text, string id = "MSG-1", bool fromMe = false,
        string? remoteJid = null, long? timestampSeconds = null) =>
        JsonSerializer.Serialize(new
        {
            @event = "messages.upsert",
            instance = "conekta",
            data = new
            {
                key = new { remoteJid = remoteJid ?? "5511999999999@s.whatsapp.net", fromMe, id },
                pushName = "Usuario Zap",
                messageType = "conversation",
                message = new { conversation = text },
                messageTimestamp = timestampSeconds ?? DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            }
        });

    private static string Payload(string @event, string? messageType = null, object? message = null) =>
        JsonSerializer.Serialize(new
        {
            @event,
            instance = "conekta",
            data = new
            {
                key = new { remoteJid = "5511999999999@s.whatsapp.net", fromMe = false, id = "MSG-X" },
                pushName = "Usuario Zap",
                messageType,
                message,
                messageTimestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            }
        });

    private static CopilotExchangeResponse Exchange(string content, List<CopilotActionDto>? actions = null) =>
        new(new CopilotMessageDto(1, "user", "pergunta", null, null, DateTime.UtcNow),
            new CopilotMessageDto(2, "assistant", content, actions, null, DateTime.UtcNow));

    [Fact]
    public async Task Texto_do_usuario_chama_o_agente_e_responde_com_markdown_adaptado()
    {
        _copilotService
            .Setup(c => c.SendMessageAsync(1, "oi", null, ChatChannel.WhatsApp))
            .ReturnsAsync(Exchange("Resposta com **negrito**\n### titulo\n[link](https://x.com)"));

        await _service.HandleEventAsync(TextPayload("oi"));

        _evolutionClient.Verify(e => e.SendTextAsync(
            "11999999999",
            "Resposta com *negrito*\ntitulo\nlink",
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Resposta_com_rascunho_pendente_adiciona_instrucao_de_confirmacao()
    {
        _copilotService
            .Setup(c => c.SendMessageAsync(1, "gastei 10 no ifood", null, ChatChannel.WhatsApp))
            .ReturnsAsync(Exchange("Revise os dados", [
                new CopilotActionDto("draft_transaction",
                    new Dictionary<string, object?> { ["value"] = 10 }, "pending")
            ]));

        await _service.HandleEventAsync(TextPayload("gastei 10 no ifood"));

        _evolutionClient.Verify(e => e.SendTextAsync(
            "11999999999",
            It.Is<string>(t => t.Contains("confirmar") && t.Contains("cancelar") && t.Contains("Revise")),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Confirmar_resolve_o_rascunho_pendente_mais_recente()
    {
        _chatRepository
            .Setup(r => r.ListRecentWithActionsAsync(1, It.IsAny<int>(), ChatChannel.WhatsApp))
            .ReturnsAsync([
                new ChatMessage
                {
                    Id = 7,
                    UserId = 1,
                    Role = ChatRole.Assistant,
                    Channel = ChatChannel.WhatsApp,
                    ActionPayload = """[{"Tool":"draft_transaction","Args":{"value":10},"Status":"pending"}]"""
                }
            ]);
        _copilotService
            .Setup(c => c.ConfirmDraftAsync(1, 7))
            .ReturnsAsync(new CopilotMessageDto(8, "assistant", "Lancamento registrado com sucesso",
                null, null, DateTime.UtcNow));

        await _service.HandleEventAsync(TextPayload("confirmar"));

        _copilotService.Verify(c => c.ConfirmDraftAsync(1, 7), Times.Once);
        _copilotService.Verify(c => c.SendMessageAsync(
            It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<ChatChannel>()), Times.Never);
        _evolutionClient.Verify(e => e.SendTextAsync("11999999999", "Lancamento registrado com sucesso",
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Cancelar_resolve_o_rascunho_com_CancelDraftAsync()
    {
        _chatRepository
            .Setup(r => r.ListRecentWithActionsAsync(1, It.IsAny<int>(), ChatChannel.WhatsApp))
            .ReturnsAsync([
                new ChatMessage
                {
                    Id = 7,
                    UserId = 1,
                    Role = ChatRole.Assistant,
                    Channel = ChatChannel.WhatsApp,
                    ActionPayload = """[{"Tool":"draft_transaction","Args":{"value":10},"Status":"pending"}]"""
                }
            ]);
        _copilotService
            .Setup(c => c.CancelDraftAsync(1, 7))
            .ReturnsAsync(new CopilotMessageDto(9, "assistant", "Lancamento cancelado",
                null, null, DateTime.UtcNow));

        await _service.HandleEventAsync(TextPayload("2", id: "MSG-2"));

        _copilotService.Verify(c => c.CancelDraftAsync(1, 7), Times.Once);
        _evolutionClient.Verify(e => e.SendTextAsync("11999999999", "Lancamento cancelado",
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Confirmar_sem_rascunho_pendente_responde_estatica_sem_chamar_o_agente()
    {
        _chatRepository
            .Setup(r => r.ListRecentWithActionsAsync(1, It.IsAny<int>(), ChatChannel.WhatsApp))
            .ReturnsAsync([]);

        await _service.HandleEventAsync(TextPayload("confirmar"));

        _copilotService.Verify(c => c.ConfirmDraftAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        _copilotService.Verify(c => c.SendMessageAsync(
            It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<ChatChannel>()), Times.Never);
        _evolutionClient.Verify(e => e.SendTextAsync(
            "11999999999",
            It.Is<string>(t => t.Contains("aguardando confirmacao")),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Rascunho_ja_consumido_nao_e_respondido_por_confirmar()
    {
        _chatRepository
            .Setup(r => r.ListRecentWithActionsAsync(1, It.IsAny<int>(), ChatChannel.WhatsApp))
            .ReturnsAsync([
                new ChatMessage
                {
                    Id = 7,
                    UserId = 1,
                    Role = ChatRole.Assistant,
                    Channel = ChatChannel.WhatsApp,
                    ActionPayload = """[{"Tool":"draft_transaction","Args":{"value":10},"Status":"consumed"}]"""
                }
            ]);

        await _service.HandleEventAsync(TextPayload("confirmar"));

        _copilotService.Verify(c => c.ConfirmDraftAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        _evolutionClient.Verify(e => e.SendTextAsync(
            "11999999999",
            It.Is<string>(t => t.Contains("aguardando confirmacao")),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Mensagem_do_proprio_numero_e_ignorada_em_silencio()
    {
        await _service.HandleEventAsync(TextPayload("oi", fromMe: true));

        _userRepository.Verify(r => r.GetByPhoneAsync(It.IsAny<string>()), Times.Never);
        _evolutionClient.Verify(e => e.SendTextAsync(It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Mensagem_de_grupo_e_ignorada_em_silencio()
    {
        await _service.HandleEventAsync(TextPayload("oi", remoteJid: "5511999999999-159159@g.us"));

        _userRepository.Verify(r => r.GetByPhoneAsync(It.IsAny<string>()), Times.Never);
        _evolutionClient.Verify(e => e.SendTextAsync(It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Numero_nao_vinculado_e_ignorado_em_silencio()
    {
        await _service.HandleEventAsync(TextPayload("oi", remoteJid: "5511988888888@s.whatsapp.net"));

        _evolutionClient.Verify(e => e.SendTextAsync(It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<CancellationToken>()), Times.Never);
        _copilotService.Verify(c => c.SendMessageAsync(
            It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<ChatChannel>()), Times.Never);
    }

    [Fact]
    public async Task Mensagem_antiga_e_ignorada()
    {
        var old = DateTimeOffset.UtcNow.AddDays(-2).ToUnixTimeSeconds();

        await _service.HandleEventAsync(TextPayload("oi", timestampSeconds: old));

        _evolutionClient.Verify(e => e.SendTextAsync(It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Reentrega_do_mesmo_evento_e_idempotente()
    {
        _copilotService.Setup(c => c.SendMessageAsync(1, It.IsAny<string>(), null, ChatChannel.WhatsApp))
            .ReturnsAsync(Exchange("Resposta"));

        var payload = TextPayload("oi");
        await _service.HandleEventAsync(payload);
        await _service.HandleEventAsync(payload);

        _copilotService.Verify(c => c.SendMessageAsync(1, "oi", null, ChatChannel.WhatsApp), Times.Once);
        _evolutionClient.Verify(e => e.SendTextAsync(It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Evento_que_nao_e_mensagem_e_ignorado()
    {
        await _service.HandleEventAsync(Payload("connection.update"));

        _evolutionClient.Verify(e => e.SendTextAsync(It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Reacao_e_outros_tipos_ficam_em_silencio()
    {
        await _service.HandleEventAsync(Payload("messages.upsert", "reactionMessage",
            new { reactionMessage = new { text = "👍" } }));

        _evolutionClient.Verify(e => e.SendTextAsync(It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Audio_recebe_resposta_estatica()
    {
        await _service.HandleEventAsync(Payload("messages.upsert", "audioMessage",
            new { audioMessage = new { } }));

        _evolutionClient.Verify(e => e.SendTextAsync("11999999999",
            It.Is<string>(t => t.Contains("arquivo")),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Imagem_e_baixada_e_enviada_ao_agente_com_a_legenda()
    {
        _evolutionClient
            .Setup(e => e.DownloadMediaBase64Async("5511999999999@s.whatsapp.net", "MSG-IMG", false,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("ZGF0YQ==");
        _copilotService
            .Setup(c => c.SendMessageAsync(1, "nota do mercado", "ZGF0YQ==", ChatChannel.WhatsApp))
            .ReturnsAsync(Exchange("Li a nota"));

        await _service.HandleEventAsync(Payload("messages.upsert", "imageMessage",
            new { imageMessage = new { caption = "nota do mercado", mimetype = "image/jpeg" } })
            .Replace("MSG-X", "MSG-IMG"));

        _copilotService.Verify(c => c.SendMessageAsync(1, "nota do mercado", "ZGF0YQ==", ChatChannel.WhatsApp), Times.Once);
        _evolutionClient.Verify(e => e.SendTextAsync("11999999999", "Li a nota",
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Imagem_com_data_uri_tem_prefixo_removido_antes_do_agente()
    {
        _evolutionClient
            .Setup(e => e.DownloadMediaBase64Async(It.IsAny<string>(), It.IsAny<string>(), false,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("data:image/jpeg;base64,QUJD");
        _copilotService
            .Setup(c => c.SendMessageAsync(1, "", "QUJD", ChatChannel.WhatsApp))
            .ReturnsAsync(Exchange("Resposta"));

        await _service.HandleEventAsync(Payload("messages.upsert", "imageMessage",
            new { imageMessage = new { mimetype = "image/jpeg" } }));

        _copilotService.Verify(c => c.SendMessageAsync(1, "", "QUJD", ChatChannel.WhatsApp), Times.Once);
    }

    [Fact]
    public async Task Falha_no_download_da_imagem_responde_estatica()
    {
        _evolutionClient
            .Setup(e => e.DownloadMediaBase64Async(It.IsAny<string>(), It.IsAny<string>(), false,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);

        await _service.HandleEventAsync(Payload("messages.upsert", "imageMessage",
            new { imageMessage = new { mimetype = "image/jpeg" } }));

        _evolutionClient.Verify(e => e.SendTextAsync("11999999999",
            It.Is<string>(t => t.Contains("Nao consegui baixar")),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Erro_de_negocio_do_agente_retorna_a_mensagem_amigavel_por_whatsapp()
    {
        _copilotService
            .Setup(c => c.SendMessageAsync(1, "mais uma", null, ChatChannel.WhatsApp))
            .ThrowsAsync(AppException.TooManyRequests("Limite diario atingido",
                "Voce atingiu o limite de mensagens do assistente por hoje. Volte amanha."));

        await _service.HandleEventAsync(TextPayload("mais uma", id: "MSG-LIM"));

        _evolutionClient.Verify(e => e.SendTextAsync("11999999999",
            "Voce atingiu o limite de mensagens do assistente por hoje. Volte amanha.",
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Imagem_com_cancellation_token_cancelado_no_webhook_ainda_entrega_confirmacao_no_whatsapp()
    {
        _evolutionClient
            .Setup(e => e.DownloadMediaBase64Async("5511999999999@s.whatsapp.net", "MSG-IMG-CANC", false,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("ZGF0YQ==");
        _copilotService
            .Setup(c => c.SendMessageAsync(1, "nota", "ZGF0YQ==", ChatChannel.WhatsApp))
            .ReturnsAsync(Exchange("Confirmacao da nota fiscal"));

        using var canceledCts = new CancellationTokenSource();
        canceledCts.Cancel(); // Simula cancelamento/timeout da requisição HTTP de entrada do webhook

        await _service.HandleEventAsync(Payload("messages.upsert", "imageMessage",
            new { imageMessage = new { caption = "nota", mimetype = "image/jpeg" } })
            .Replace("MSG-X", "MSG-IMG-CANC"), canceledCts.Token);

        _evolutionClient.Verify(e => e.SendTextAsync("11999999999", "Confirmacao da nota fiscal",
            It.Is<CancellationToken>(ct => !ct.IsCancellationRequested)), Times.Once);
    }

    [Fact]
    public async Task Imagem_enviada_por_numero_com_variante_do_nono_digito_encontra_usuario_e_responde_ao_remetente()
    {
        // Usuário cadastrado no banco com 11 dígitos ("11988887777"), mas mensagem vem com 10 dígitos ("551188887777")
        _userRepository.Setup(r => r.GetByPhoneAsync("1188887777")).ReturnsAsync((User?)null);
        _userRepository.Setup(r => r.GetByPhoneAsync("11988887777"))
            .ReturnsAsync(new User { Id = 2, FullName = "Usuario 2", Phone = "11988887777" });

        _evolutionClient
            .Setup(e => e.DownloadMediaBase64Async("551188887777@s.whatsapp.net", "MSG-IMG-VAR", false,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("ZGF0YQ==");
        _copilotService
            .Setup(c => c.SendMessageAsync(2, "", "ZGF0YQ==", ChatChannel.WhatsApp))
            .ReturnsAsync(Exchange("Dados extraidos"));

        var payload = Payload("messages.upsert", "imageMessage",
            new { imageMessage = new { mimetype = "image/jpeg" } })
            .Replace("5511999999999@s.whatsapp.net", "551188887777@s.whatsapp.net")
            .Replace("MSG-X", "MSG-IMG-VAR");

        await _service.HandleEventAsync(payload);

        // A resposta deve ser enviada exatamente para o remetente original ("1188887777")
        _evolutionClient.Verify(e => e.SendTextAsync("1188887777", "Dados extraidos",
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
