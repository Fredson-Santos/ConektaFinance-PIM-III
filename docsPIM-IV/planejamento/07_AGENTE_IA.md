# 07 — Agente de IA com Function Calling

> **Evolução da F7 (Copilot IA).** Transforma o assistente atual (prompt único com snapshot fixo de contexto) em um **agente** capaz de decidir quais dados consultar (tools de leitura), gravar lançamentos (tool de escrita) e ler notas fiscais por visão computacional.
> **Decisões registradas:** provedor LLM = API NVIDIA NIM (`https://integrate.api.nvidia.com/v1`, compatível com OpenAI, modelos gratuitos) · criação direta quando o comando é explícito · rascunho + confirmação no chat para notas fiscais e dados extraídos de imagem.

---

## 1. Arquitetura do agente

```
POST /api/v1/copilot/messages { content, imageBase64? }
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ CopilotService                                              │
│  1. valida cota diária e payload                            │
│  2. carrega janela de histórico (IChatMessageRepository)     │
│  3. se houver imagem → extrai dados da nota (vision model)  │
│  4. monta CopilotAgentRequest (msg + histórico + contexto)  │
└───────────────┬─────────────────────────────────────────────┘
                ▼
┌─────────────────────────────────────────────────────────────┐
│ LlmCopilotClient — LOOP DE FUNCTION CALLING (máx. 4 voltas)  │
│  POST /chat/completions { messages, tools }                 │
│   ├── resposta final → CopilotReply { content, actions }    │
│   └── tool_calls ──► CopilotToolProvider.ExecuteAsync ──┐   │
│        │                                  resultado JSON │   │
│        └──────── append tool result ◄──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                ▼
┌─────────────────────────────────────────────────────────────┐
│ CopilotToolProvider (tools executam com o userId do token)   │
│  LEITURA: get_financial_summary · get_category_breakdown    │
│           list_recent_transactions · list_budget_alerts     │
│  ESCRITA: create_transaction (grava direto + gera alertas)   │
│  RASCUNHO: draft_transaction (pede confirmação no chat)     │
└─────────────────────────────────────────────────────────────┘
                ▼
Fallback: CompositeCopilotClient → RuleBasedCopilotClient (sem rede)
```

**Regras de autonomia (system prompt):**
- Usuário declara gasto/recebimento explícito com valor ("gastei 100 reais com ifood") → `create_transaction` direto.
- Dados de imagem/nota fiscal ou informação incompleta → `draft_transaction` → botão "Confirmar" no chat → `POST /copilot/messages/{id}/confirm` grava.

## 2. Fluxo de confirmação (human-in-the-loop)

```
Usuário envia foto da nota
  → vision model extrai { estabelecimento, total, data, itens }
  → agente responde com resumo extraído + action draft_transaction
  → frontend renderiza botões [✅ Confirmar] [✏️ Revisar no formulário]
  → POST /copilot/messages/{id}/confirm
      → CopilotService.ConfirmAsync(userId, messageId)
      → cria transação via ITransactionService (validações reais)
      → marca a action como consumida (ActionPayload)
      → nova mensagem de assistente confirmando o lançamento
```

- Confirmar duas vezes → 409.
- `draft_transaction` **nunca** grava; só `confirm` grava (o gravador é o backend, nunca o LLM).

## 3. Tools (contrato)

| Tool | Args | Retorna |
|---|---|---|
| `get_financial_summary` | `month?`, `year?` | saldo, entradas, saídas, teto mensal, % do teto |
| `get_category_breakdown` | `month?`, `year?`, `kind?` | por categoria: gasto, teto, %, status |
| `list_recent_transactions` | `limit?`, `type?`, `month?` | transações recentes com categoria |
| `list_budget_alerts` | — | alertas não lidos |
| `create_transaction` | `type`, `description`, `value`, `categoryName`, `date?` | transação criada (+ disparo de alerta de orçamento) |
| `draft_transaction` | `type`, `description`, `value`, `categoryName` | rascunho p/ confirmação (não grava) |

Todas as tools recebem o `userId` do token JWT — nunca um id vindo do LLM.

## 4. Mudanças por camada

| Camada | Mudança |
|---|---|
| `Domain` | `ChatMessage.ImageUrl` (nota fiscal anexada) + migration |
| `Application` | `ICopilotToolProvider`/`CopilotToolProvider`; `ICopilotAiClient` passa a receber `CopilotAgentRequest` (msg + histórico + contexto); `CopilotService.ConfirmAsync`; DTOs (`SendCopilotMessageRequest` com `imageBase64?`, `CopilotExchangeResponse` com `imageUrl?`) |
| `Infrastructure` | `LlmCopilotClient` com `tools` + loop; `ExtractReceiptAsync` (vision); `RuleBasedCopilotClient` mantido como fallback |
| `Controllers` | `POST /copilot/messages/{id}/confirm` |
| Frontend | upload de foto no `AiPanel`, botões de confirmação de rascunho, thumbnails no histórico |
| Config | `Copilot:VisionModel`, `Copilot:MaxToolIterations`, `Copilot:HistoryWindowSize`; `.env.example` com valores NVIDIA |

## 5. Segurança e limites

- Cota diária existente (30 mensagens) + rate limiting "auth" já aplicado ao controller.
- Limite de iterações do loop (default 4) impede loop infinito de tool calls.
- Imagens: validação de tipo (jpeg/png/webp) e tamanho (≤ 5 MB), salvas em `Storage:UploadsPath/copilot/`.
- `create_transaction`/`draft_transaction` só aceitam categorias do próprio usuário (busca por nome; sem match → tool devolve lista de nomes válidos para o LLM pedir esclarecimento).
- IA sempre mockada nos testes (regra `tests.md`); sem rede na suíte.

## 6. Provedor (NVIDIA NIM)

```
Copilot__BaseUrl=https://integrate.api.nvidia.com/v1
Copilot__Model=nvidia/nemotron-3.5-lightning-30b-a3b   # benchmark: 1,8s (glm-5.3-flash: 106,9s)
Copilot__VisionModel=meta/llama-3.2-90b-vision-instruct  # leitura de nota fiscal
Copilot__ApiKey=<chave gratuita em build.nvidia.com>
```

Cliente HTTP já é compatível com o formato OpenAI (`/chat/completions`); trocar de provedor = trocar variáveis de ambiente.

## 7. Fase 2 — Canal WhatsApp (Evolution API / Baileys)

Decisão registrada: usar **API não oficial** (Evolution API sobre Baileys) — sem verificação Meta Business, deploy via Docker, pareamento por QR code. Adequado ao escopo acadêmico.

```
POST /api/v1/webhooks/whatsapp (assinatura/verify token da Evolution)
   ├── resolve telefone → userId   (IUserRepository.GetByPhoneAsync já existe)
   ├── baixa mídia da nota → base64
   └── chama o MESMO CopilotService.SendMessageAsync(userId, texto, imagemBase64)
   └── responde via REST da Evolution
```

**⚠️ Risco:** APIs não oficiais violam os termos da Meta e o número pode ser banido. Usar **chip pré-pago dedicado** para o projeto — nunca o número pessoal.
