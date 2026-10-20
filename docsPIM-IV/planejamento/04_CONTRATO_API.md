# 04 — Contrato da API

> **Etapa 4 do `TASKS_MIGRACAO_FRONT_BACK.md`.** Especificação dos endpoints **sem implementá-los**. Formatado em Markdown; na implementação, o backend gera OpenAPI/Swagger automaticamente e este documento é a referência de aceitação.
> Modelo de dados: doc 03. Tela → endpoint: §12.

---

## 1. Convenções (4.1)

| Tema | Convenção |
|---|---|
| Base | `/api/v1` (proxy Nginx já encaminha `/api` → backend; versão explícita permite evolução) |
| Autenticação | JWT Bearer (`Authorization: Bearer {token}`), 60 min; claims: `sub` (userId), `email`, `name`, `accountType` |
| Content-Type | `application/json` (exceto uploads `multipart/form-data` e downloads `text/csv`/`application/json`) |
| Idioma | Mensagens de erro/validação em **pt-BR** (regra de produto) |
| Datas | ISO 8601 UTC (`2026-10-20T14:30:00Z`); aceita `YYYY-MM-DD` em parâmetros de data |
| Moeda | `decimal` com 2 casas (`4286.50`); **formato pt-BR (R$ 1.234,56) é responsabilidade do front** |
| Enums | strings minúsculas: `expense`/`income`, `manual`/`import`/`copilot` |
| Paginação | `?page=1&pageSize=20` (máx. 100); resposta com envelope `meta` |
| Filtros | query params explícitos (ver cada recurso); combináveis |
| Ordenação | `?sortBy=transactionDate&order=desc` (whitelist por recurso) |
| Erros | **RFC 7807 ProblemDetails**: `{ "type", "title", "status", "detail", "errors": { "campo": ["msgs"] } }` — middleware global (sem vazamento de stack) |
| Sucesso | 200 consulta · 201+Location criação · 204 sem corpo |
| Erros comuns | 400 validação · 401 sem/inválido token · 403 recurso de outro usuário · 404 inexistente · 409 conflito (categoria em uso, duplicado) · 429 rate limit (OTP/login) |

## 2. Autenticação — `/api/v1/auth` (público)

| Método | Rota | Request | Response | Erros |
|---|---|---|---|---|
| POST | `/auth/register` | `{ fullName, email, password (min 8), phone? }` | 201 `{ token, user }` (clona categorias padrão — doc 03 D3) | 400 validação; 409 e-mail em uso |
| POST | `/auth/login` | `{ email, password }` | 200 `{ token, user }` | 401 "E-mail ou senha inválidos." (mensagem genérica) |
| POST | `/auth/otp/request` | `{ phone }` | 202 `{ resendAllowedInSeconds: 45 }` (dev: `{ devCode }` quando simulação ligada) | 400 telefone inválido; **429** reenvio antes de 45 s |
| POST | `/auth/otp/verify` | `{ phone, code }` | 200 `{ token, user }` (cria/autentica usuário por telefone; primeiro acesso completa perfil depois) | 400 código expirado; 401 código inválido; 429 excedeu 3 tentativas |
| POST | `/auth/demo` | `{}` | 200 `{ token, user }` (conta de demonstração com dados seed) | 503 indisponível |
| POST | `/auth/refresh` *(P2)* | `{ refreshToken }` | 200 `{ token, refreshToken }` (rotação) | 401 inválido/revogado |

`user` = `{ id, fullName, displayName, email, phone, avatarUrl, accountType, monthlyCeiling, currency, cycleStartDay }`.

## 3. Usuário autenticado — `/api/v1/users/me` (4.5)

| Método | Rota | Request | Response | Erros |
|---|---|---|---|---|
| GET | `/users/me` | — | 200 `user` (acima) | 401 |
| PUT | `/users/me` | `{ fullName?, displayName?, phone?, cpf?, occupation? }` | 200 `user` | 400 validação |
| PUT | `/users/me/avatar` | `multipart/form-data` (JPG/PNG/WebP ≤ 2MB) | 200 `{ avatarUrl }` | 400 tipo/tamanho |
| PUT | `/users/me/password` | `{ currentPassword, newPassword (min 8) }` | 204 | 400 senhas não conferem/fraca |
| GET | `/users/me/preferences` | — | 200 `{ monthlyCeiling, currency, cycleStartDay }` | 401 |
| PUT | `/users/me/preferences` | `{ monthlyCeiling?, currency?, cycleStartDay? }` | 200 preferências | 400 `cycleStartDay` fora de 1–28 |
| POST | `/users/me/reset-data` | `{}` | 204 (apaga transações/orçamentos/alertas; mantém categorias — doc 03 §6) | 401 |
| DELETE | `/users/me` | `{ password }` (confirmação) | 204 (exclui conta em cascata) | 400 senha incorreta |

## 4. Categorias — `/api/v1/categories`

| Método | Rota | Request | Response | Erros |
|---|---|---|---|---|
| GET | `/categories?kind=expense\|income&month=&year=` | — | 200 `[{ id, name, description, colorCode, icon, kind, sortOrder, spent?, limit? }]` — `spent`/`limit` preenchidos quando `month`/`year` informados | 401 |
| POST | `/categories` | `{ name, description?, colorCode, icon?, kind }` | 201 categoria | 400; 409 nome duplicado |
| PUT | `/categories/{id}` | `{ name?, description?, colorCode?, icon?, sortOrder? }` | 200 | 403/404; 409 nome duplicado |
| DELETE | `/categories/{id}` | — | 204 | 403/404; **409** "categoria com lançamentos" (sugerir recategorizar) |

## 5. Orçamentos — `/api/v1/budgets`

| Método | Rota | Request | Response | Erros |
|---|---|---|---|---|
| PUT | `/budgets` (upsert por categoria+período) | `{ categoryId, limitValue (≥0), month, year }` | 200 `{ categoryId, limitValue, month, year }` (0 = remove teto) | 400; 403 categoria alheia; 404 categoria |
| GET | `/budgets?month=&year=` | — | 200 `[{ categoryId, categoryName, limitValue, spent, percentageUsed, status }]` | 401 |

`status` calculado com as regras do doc 01 §5.2: `over` (>100), `warn` (80–100), `ok` (<80), `noLimit` (limite 0).

## 6. Transações — `/api/v1/transactions`

| Método | Rota | Query/Body | Response | Erros |
|---|---|---|---|---|
| GET | `/transactions` | `?month&year` **ou** `?start&end` · `?categoryId` · `?type=expense\|income` · `?search` (descrição, substring, case-insensitive) · `?page&pageSize` · `?sortBy=transactionDate\|value&order=asc\|desc` | 200 `{ items: [{ id, type, description, value, transactionDate, paymentMethod, observation, isRecurrent, status, source, category: {id, name, colorCode, icon} }], meta: { page, pageSize, totalItems, totalPages } }` + cabeçalho `X-Total-Sum` (soma `value` dos filtrados p/ resumo) | 400; 401 |
| GET | `/transactions/{id}` | — | 200 item | 403/404 |
| POST | `/transactions` | `{ type, categoryId, description, value (>0), transactionDate, paymentMethod?, observation?, isRecurrent? }` | 201 item (+`Location`) | 400 validação (FluentValidation); 403/404 categoria; data futura |
| PUT | `/transactions/{id}` | body de POST | 200 item | 400/403/404 |
| DELETE | `/transactions/{id}` | — | 204 | 403/404 |

**Efeito colateral (regra 01 §5.2):** após criar/editar despesa, o serviço recalcula o orçamento da categoria no mês e gera `Alerts` (80% → `categoryLimit`; >100% → `budgetExceeded`) com dedup por (categoria, mês, tipo).

## 7. Dashboard — `/api/v1/dashboard` (4.3 — agregados no backend)

| Método | Rota | Query | Response |
|---|---|---|---|
| GET | `/dashboard/overview` | `?month&year` (default atual) | `{ balance, income, expense, expenseToCeilingPercentage (saídas/teto geral), incomeChangePct, expenseChangePct (vs mês anterior), updatedAt }` |
| GET | `/dashboard/weekly-expenses` | `?date` (default hoje) | `{ total, dailyAverage, days: [{ weekday, value, percentage } ×7] }` |
| GET | `/dashboard/recent-transactions` | `?limit=5` | `{ items: [transaction ×N] }` (formato §6) |
| GET | `/dashboard/budget-meters` | `?month&year&top=4` | `{ items: [{ categoryId, name, colorCode, spent, limit, percentage }] }` (ordenado por % desc) |

## 8. Relatórios — `/api/v1/reports`

| Método | Rota | Query | Response |
|---|---|---|---|
| GET | `/reports/summary` | `?start&end` (default mês corrente) | `{ totalIncome, totalExpense, balance, savingsRate, averageMonthlyExpense, largestExpense: { amount, description, date }, recurrentSpent, recurrentCount, previousPeriod: { incomeChangePct, expenseChangePct } }` |
| GET | `/reports/by-category` | `?start&end&kind=expense` | `[{ categoryId, name, colorCode, total, percentage }]` (donuts dos relatórios) |
| GET | `/reports/trend` | `?months=6` | `[{ period: "MM/yyyy", income, expense, saved } ×N]` (gráfico 6M e barras duplas) |
| GET | `/reports/daily` | `?start&end` | `[{ day: "01".."31", value } ×N]` |
| GET | `/reports/export.csv` | `?start&end` | 200 `text/csv` (attachment) — transações do período |
| GET | `/reports/export.json` | `?start&end` | 200 JSON consolidado (transações + agregados) |

**PDF é gerado no front** (`jspdf`, P2) a partir dos endpoints acima — evita dependência de PDF no backend.

## 9. Alertas — `/api/v1/alerts`

| Método | Rota | Query/Request | Response | Erros |
|---|---|---|---|---|
| GET | `/alerts` | `?unreadOnly=false` | 200 `[{ id, type, title, message, category?: {id, name}, isRead, createdAt }]` | 401 |
| GET | `/alerts/unread-count` | — | 200 `{ count }` (alimenta o dot do sino) | 401 |
| PUT | `/alerts/{id}/read` | — | 204 | 403/404 |
| DELETE | `/alerts/{id}` | — | 204 (dispensa) | 403/404 |

## 10. Insights — `/api/v1/insights`

| Método | Rota | Response |
|---|---|---|
| GET | `/insights` | 200 `[{ title, description, suggestion, severity: "info"\|"warning"\|"critical" }]` — calculados on the fly (doc 03 D5): estouro projetado, categoria em alta (p/ 6M), maior variação vs mês anterior, taxa de reserva. P1: 4 regras cobrindo os insights exibidos no protótipo |

## 11. Copilot IA — `/api/v1/copilot` (4.4)

**Decisão de formato (a validar em 7.2):** v1 **sem streaming** (resposta única), provedor de IA abstraído atrás de interface (`ICopilotAiClient`) com base/key/model via variáveis de ambiente — nunca hardcoded. Custo controlado por: limite de mensagens/dia por usuário (429), histórico limitado às últimas 10 mensagens de contexto, e **fallback rule-based** (as 4 intents do protótipo) quando o provedor falha/atingir limite.

| Método | Rota | Request | Response | Erros |
|---|---|---|---|---|
| GET | `/copilot/history` | — | 200 `{ items: [{ id, role: "user"\|"assistant", content, actions?, createdAt }] }` | 401 |
| POST | `/copilot/messages` | `{ content }` | 200 `{ userMessage, assistantMessage }` — ver contrato abaixo | 400 vazio; 401; 429 limite diário |
| DELETE | `/copilot/history` | — | 204 | 401 |

**Contrato de function calling (resposta):**

```json
{
  "userMessage": { "id": 10, "role": "user", "content": "Registra um gasto de 45 reais no mercado", "createdAt": "..." },
  "assistantMessage": {
    "id": 11, "role": "assistant",
    "content": "Posso registrar esse gasto para você. Revise os dados antes de confirmar:",
    "actions": [
      { "tool": "open_transaction_sheet",
        "args": { "type": "expense", "description": "Mercado", "value": 45.0, "categoryName": "Alimentação" } }
    ],
    "createdAt": "..."
  }
}
```

**Tools expostas ao LLM (executadas no servidor com dados do usuário):**
1. `get_financial_summary(period?)` → entradas/saídas/saldo/teto (alimenta respostas "resumo do mês");
2. `get_category_breakdown(period?)` → gastos/limites por categoria (alimenta "onde posso economizar");
3. `create_transaction_draft(...)` → NÃO grava; devolve `open_transaction_sheet` para o usuário confirmar no sheet (o protótipo apenas abre o sheet — o backend nunca lança transação sem confirmação do usuário);
4. `get_budget_alerts()` → tetos em atenção/estourados.

`actions` é salvo em `ChatMessages.ActionPayload` e reexecutado no front (abrir sheet pré-preenchido). Histórico e sugestões seguem o comportamento do doc 01 §5.5.

## 12. Importação — `/api/v1/imports` (P2)

| Método | Rota | Request | Response | Erros |
|---|---|---|---|---|
| POST | `/imports/preview` | `multipart` (.ofx/.csv/.xlsx ≤ 5MB) | 202 `{ batchId, fileName, items: [{ date, description, amount, suggestedCategory: {id, name} | null, isDuplicate }], autoCategorize, ignoreDuplicates }` | 400 formato não suportado |
| POST | `/imports/{batchId}/confirm` | `{ itemIds[], autoCategorize, ignoreDuplicates }` | 201 `{ importedCount, skippedDuplicates }` | 404/409 batch já confirmado |

## 13. Tabela tela → endpoints (4.2/4.7)

| Tela | Endpoints consumidos |
|---|---|
| Login (WhatsApp) | `POST /auth/otp/request` · `POST /auth/otp/verify` |
| Login (e-mail) / demo | `POST /auth/login` · `POST /auth/register` · `POST /auth/demo` |
| Shell (popover usuário, sino) | `GET /users/me` · `GET /alerts/unread-count` · `GET /alerts` · `PUT /alerts/{id}/read` · `DELETE /alerts/{id}` |
| Dashboard | `GET /dashboard/overview` · `/dashboard/weekly-expenses` · `/dashboard/recent-transactions` · `/dashboard/budget-meters` |
| Gastos | `GET /transactions` (filtros/paginação) · `POST /transactions` · `PUT /transactions/{id}` · `DELETE /transactions/{id}` · `GET /budgets` (card consumo) · `GET /reports/by-category` (maiores categorias) |
| Categorias & Orçamentos | `GET /categories?month&year` · `POST /categories` · `PUT /categories/{id}` · `DELETE /categories/{id}` · `PUT /budgets` · `GET /budgets` |
| Relatórios | `GET /reports/summary` · `/reports/by-category` · `/reports/trend` · `/reports/daily` · `GET /reports/export.csv` · `GET /reports/export.json` · `GET /insights` |
| Configurações | `GET/PUT /users/me` · `PUT /users/me/avatar` · `PUT /users/me/password` · `GET/PUT /users/me/preferences` · `POST /users/me/reset-data` · `DELETE /users/me` |
| Copilot IA | `GET /copilot/history` · `POST /copilot/messages` · `DELETE /copilot/history` |
| Importar extrato | `POST /imports/preview` · `POST /imports/{id}/confirm` |

## 14. Autorização por recurso (4.5)

- Todo endpoint (exceto `/auth/*` públicos) exige JWT; o userId vem da claim `sub` — **nunca do body/query**.
- Ownership verificado em **service**: recurso sem `UserId` correspondente → 404 (não revela existência); tentativa de escrita em recurso alheio → 403.
- Categorias de `kind=income` não aceitam orçamento (400); transação de `type=income` exige categoria `kind=income` (400).
- Uploads: validação de MIME/tamanho; arquivos servidos de caminho controlado (sem path traversal).
- Rate limiting: `/auth/otp/request`, `/auth/login` (e `/copilot/messages` por cota diária).

## 15. Validação — cada tela monta só com as respostas? (4.7)

- **Dashboard:** overview + weekly + meters + recent cobrem 100% dos KPIs/gráficos/listas (mobile e desktop). OK.
- **Gastos:** `GET /transactions` com agrupamento por data no front (datas vêm do payload) + `X-Total-Sum` para o resumo + `GET /budgets` p/ card de limite. OK.
- **Categorias:** `GET /categories?month&year` retorna spent+limit+status por categoria — consolidado derivado no front (soma) ou via `GET /budgets`. OK.
- **Relatórios:** summary + by-category + trend + insights cobrem KPIs, donuts, gráfico 6M, comparativo e tabela. OK.
- **Configurações:** perfil + preferências + senha + zona de perigo. OK.
- **IA:** histórico + mensagens com actions. OK.
- **Alertas:** list + unread-count + read/dismiss. OK.

## 16. Aceite da etapa

- [x] 4.1 Convenções definidas (§1)
- [x] 4.2 Endpoints por tela (§2–§13)
- [x] 4.3 Agregados do dashboard no backend (§7)
- [x] 4.4 Contrato do Copilot com function calling, sem streaming na v1 (§11)
- [x] 4.5 Autorização por recurso (§14)
- [x] 4.6 Contrato escrito em Markdown (OpenAPI gerado na implementação)
- [x] 4.7 Validação de montagem de telas (§15)

**Critério de aceite:** toda ação do inventário (doc 01 §2) tem endpoint correspondente — verificado na tabela §13 (inclui N1–N17 do inventário, exceto itens front-only do doc 01 §7, que não exigem backend).
