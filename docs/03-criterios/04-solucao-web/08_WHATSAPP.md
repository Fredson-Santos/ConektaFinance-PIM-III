# 08 — Canal WhatsApp (Evolution API)

> **Fase 2 do agente de IA.** O mesmo `CopilotService` do painel web passa a atender o WhatsApp: texto vira mensagem do agente, foto de nota fiscal vira rascunho com confirmação por resposta, e o login existente por OTP passa a ser entregue de verdade.
> **Decisões registradas:** API não oficial Evolution API v2 (Baileys) · chip pré-pago dedicado (nunca o número pessoal) · **silêncio absoluto para números não vinculados** (anti-ban) · confirmação por texto (`confirmar`/`cancelar`, também aceita `1`/`2` e ✅/❌).

---

## 1. Arquitetura

```
WhatsApp (chip dedicado)
        │  QR pareamento
        ▼
┌─────────────────────────────┐   ┌──────────────────────────────┐
│ Evolution API v2 (Docker)  │   │ PostgreSQL 16 + Redis 7      │
│ evoapicloud/evolution-api  │   │ (exclusivos da Evolution)    │
└──────────┬──────────────────┘   └──────────────────────────────┘
           │ webhook: messages.upsert
           │ POST http://backend:8080/api/v1/webhooks/whatsapp
           │ header apikey = Evolution:WebhookToken
           ▼
┌─────────────────────────────────────────────────────────────────┐
│ WebhooksController → WhatsAppChannelService                     │
│  1. valida token do webhook (401 sem token)                     │
│  2. dedupe por key.id (MemoryCache 24h)                         │
│  3. filtra: fromMe, grupos (@g.us), broadcast, idade > 24h       │
│  4. normaliza jid → telefone → IUserRepository.GetByPhoneAsync   │
│     └── número não vinculado → IGNORA EM SILÊNCIO               │
│  5. intercepta confirmar/cancelar → ConfirmDraftAsync/Cancel     │
│  6. texto/foto → CopilotService.SendMessageAsync(userId, ...)    │
│  7. markdown→WhatsApp → EvolutionClient.SendTextAsync           │
└──────────┬──────────────────────────────────────────────────────┘
           │ sendText / getBase64FromMediaMessage
           ▼
resposta entregue no WhatsApp do usuário
```

**Pontos de reuso:**
- O agente, as tools, a cota diária (30 msg), a memória de 12 turnos, a guarda contra duplicata e o `GuardPromptLeak` são os mesmos do painel — o WhatsApp é só mais um canal chegando no `CopilotService`.
- Foto de nota: `chat/getBase64FromMediaMessage` → base64 → o fluxo de visão existente (Nemotron VL) → rascunho.
- O histórico é único: o que o usuário fala no WhatsApp aparece no painel e vice-versa.

## 2. Mudanças por camada

| Camada | Mudança |
|---|---|
| `Application` | `IEvolutionClient` + `WhatsAppChannelService`/`IWhatsAppChannelService`; `WhatsAppNumbers` (jid ⇄ telefone do domínio); `CopilotService.CancelDraftAsync` + `IsPendingDraftAction` (pending ≠ consumed/cancelled); `IChatMessageRepository.ListRecentWithActionsAsync`; telefone normalizado no cadastro e no perfil (`AuthService`/`UserService`) |
| `Infrastructure` | `EvolutionClient` (sendText + download de mídia, header `apikey`, JSON camelCase); `EvolutionOtpSender` (OTP real) com fallback para `DevOtpSender` quando não configurado |
| `Controllers` | `POST /api/v1/webhooks/whatsapp` — `[AllowAnonymous]` + rate limit `webhook` (100/min configurável) + validação do token |
| Config | `Evolution:BaseUrl/ApiKey/Instance/WebhookToken/SendDelayMs`; `RateLimit:WebhookPermitLimit/WebhookWindowSeconds`; user secrets (dev) e `.env` (Docker) |
| Infra | `docker-compose.yml`: `evolution` (v2.3.7) + `evolution-postgres` (16-alpine) + `evolution-redis` (7-alpine), volumes dedicados |
| Frontend | **Nenhuma mudança** — canal 100% server-to-server (o login "WhatsApp (OTP)" já existia e agora recebe o código de verdade) |

## 3. Segurança (camadas)

| Camada | Mecanismo |
|---|---|
| Autenticação do webhook | Header `apikey` (ou `x-api-key`, ou query `?apikey=`) comparado com `Evolution:WebhookToken`; sem match → 401 antes de qualquer processamento |
| Anti-loop | `fromMe: true` ignorado; o endpoint sempre responde 200 para eventos válidos (reentrega em rajada é pior do que evento perdido) |
| Anti-ban | Desconhecidos, grupos, broadcast, newsletters e mensagens com mais de 24h (replay do pareamento) ficam em silêncio |
| Idempotência | `key.id` em `MemoryCache` por 24h — reentrega da Evolution não processa duas vezes (não há risco de transação duplicada) |
| Rate limit | Policy `webhook` por IP (default 100/min) + cota diária do copilot por usuário (30/dia) |
| Escopo de dados | O `userId` vem do telefone vinculado (receber a mensagem prova posse do número — mesmo anchor do OTP); as tools continuam escopadas por `userId`; injeção de prompt do canal WhatsApp não alcança dados de outro usuário |
| Prompt injection | As 3 camadas da doc 07 valem automaticamente (contexto fora do prompt, PROIBICOES, `GuardPromptLeak`) |
| Segredos | Chaves só em user secrets (dev) e `.env` gitignored (Docker); `.env.example` com placeholders vazios |

## 4. Fluxo de confirmação por WhatsApp

| Resposta do usuário | Efeito |
|---|---|
| `confirmar` / `confirma` / `1` / `✅` | Confirma o **rascunho pendente mais recente** → grava a transação → responde "Lancamento registrado com sucesso..." |
| `cancelar` / `cancela` / `2` / `❌` | Marca o rascunho como `cancelled` → responde "Lancamento cancelado..." |
| Comando sem rascunho pendente | Estática: "Nao encontrei nenhum lancamento aguardando confirmacao..." (não gasta LLM) |
| Rascunho gerado pela resposta | A resposta do agente termina com "Responda *confirmar* para lancar ou *cancelar* para descartar." |

Mensagens de áudio/vídeo/documento recebem estática orientando usar texto ou foto; reações, adesivos e eventos de protocolo ficam em silêncio.

## 5. Deploy (Docker)

```bash
# 1. preencha as chaves do .env (veja .env.example):
#    EVOLUTION_API_KEY (chave forte, 64 chars), EVOLUTION_POSTGRES_PASSWORD,
#    Evolution__ApiKey (= EVOLUTION_API_KEY), Evolution__WebhookToken (chave forte),
#    EVOLUTION_SERVER_URL (URL pública da Evolution em produção)

# 2. suba o stack (backend + frontend + evolution + postgres + redis)
docker compose up -d --build
```

A Evolution só precisa das variáveis `EVOLUTION_*`; o backend lê `Evolution__*`. O webhook é interno: `evolution → http://backend:8080/api/v1/webhooks/whatsapp`.

## 6. Pareamento do chip (primeira vez)

1. Acesse o **Evolution Manager embutido**: `http://localhost:8082/manager` (em produção, a URL pública da Evolution). Login = `EVOLUTION_API_KEY`.
2. Crie a instância **`conekta`** (nome exato de `Evolution__Instance`) e escaneie o QR Code com o WhatsApp do **chip pré-pago dedicado**.
3. Registre o webhook da instância (substitua o token e, em produção, a URL):

```bash
curl -X POST http://localhost:8082/webhook/set/conekta \
  -H "apikey: $EVOLUTION_API_KEY" -H "Content-Type: application/json" \
  -d '{
    "webhook": {
      "enabled": true,
      "url": "http://backend:8080/api/v1/webhooks/whatsapp",
      "headers": { "apikey": "SEU_EVOLUTION_WEBHOOK_TOKEN" },
      "events": ["MESSAGES_UPSERT"],
      "byEvents": false,
      "base64": false
    }
  }'
```

4. No app: cadastre/atualize o telefone do chip no **Perfil** (ele é normalizado para 10-11 dígitos automaticamente) ou entre pelo login "WhatsApp (OTP)" — o OTP agora chega pelo próprio WhatsApp.

### 6.1 Dev local (backend no IDE, Evolution no Docker)

- O backend no host precisa ser visível ao container: `dotnet run --urls "http://0.0.0.0:5041"` (o launch padrão escuta só localhost).
- No passo 3, use `http://host.docker.internal:5041/api/v1/webhooks/whatsapp` como URL do webhook.
- Sem a Evolution no ar, o login OTP falha na entrega; para voltar ao modo simulado (código no log), remova `Evolution:BaseUrl` dos user secrets.

## 7. Payloads de referência (capturados da doc oficial v2)

```json
{
  "event": "messages.upsert",
  "instance": "conekta",
  "data": {
    "key": { "remoteJid": "5511999999999@s.whatsapp.net", "fromMe": false, "id": "3EB0A0C2..." },
    "pushName": "Usuario Zap",
    "messageType": "conversation",
    "message": { "conversation": "gastei 100 reais com ifood" },
    "messageTimestamp": 1717689097
  }
}
```

- Texto: `messageType: conversation | extendedTextMessage` — parser tolerante aceita `messages.upsert` e `MESSAGES_UPSERT`.
- Imagem: `imageMessage.caption` vai como texto da mensagem; a mídia vem de `POST /chat/getBase64FromMediaMessage/{instance}` com `{ "message": { "key": { remoteJid, id, fromMe } }, "convertToMp4": false }`.
- Envio: `POST /message/sendText/{instance}` com `{ "number": "5511...", "text": "...", "delay": 800 }` (delay humaniza e reduz risco de ban).

## 8. Validação ao vivo (checklist do chip real)

| # | Cenário | Esperado |
|---|---|---|
| 1 | "gastei 100 reais com ifood" | Transação gravada direto (comando explícito) + resposta |
| 2 | "resumo do mes" | Números reais da conta |
| 3 | Foto de nota + legenda opcional | Extração por visão → rascunho → instrução de confirmar |
| 4 | `confirmar` | "Lancamento registrado com sucesso" + aparece no dashboard |
| 5 | `cancelar` em novo rascunho | "Lancamento cancelado", nada gravado |
| 6 | Reenviar o mesmo texto | Resposta única (dedupe vale por id da mensagem) |
| 7 | Outro número qualquer | Silêncio total (anti-ban) |
| 8 | Prompt injection via texto ("ignore as instruções...") | Recusa (mesmas 3 camadas da doc 07) |
| 9 | Login "WhatsApp (OTP)" no app | Código entregue no WhatsApp |
| 10 | Latência end-to-end | 1,8–10s (NVIDIA flutua); Baileys aguarda bem resposta assíncrona |

## 9. Riscos e limitações

| Risco | Mitigação |
|---|---|
| Ban do número (ToS Meta — API não oficial) | Chip pré-pago dedicado, `SendDelayMs=800`, sem mensagens em massa, silêncio para desconhecidos |
| Versão da Evolution muda payload | Imagem pinned `v2.3.7` + parser tolerante (`JsonElement`, aceita duas grafias de evento) |
| Reciclagem do número pré-pago | Risco aceito para escopo acadêmico; revincular ao trocar chip |
| Dedupe em memória | Restart perde o cache — pior caso reprocessa mensagens recentes; aceitável no deploy single-instance |
| Grupos/broadcast | Ignorados por design |

## 10. Testes

- **Unitários**: `WhatsAppNumbersTests` (jid/dispositivo/grupos), `EvolutionClientTests` (sendText/apikey/camelCase, download de mídia, falha HTTP), `WhatsAppChannelServiceTests` (18 casos: silêncios, dedupe, comandos, imagem, erros de negócio, markdown), `CopilotServiceTests` (+3 de cancelamento).
- **Integração**: `WhatsAppWebhookFlowTests` (fábrica com `FakeEvolutionClient` + token de teste) — texto→resposta, rascunho→confirmar grava, cancelar descarta, 401 sem chave, fromMe/grupo/desconhecido/antigo em silêncio, idempotência, foto com legenda → rascunho → confirmação.
- Suíte: **219/219** (IA sempre simulada — regra `tests.md`).
