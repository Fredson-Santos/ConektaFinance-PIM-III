# 05 — Análise de Gap do Backend

> **Etapa 5 do `TASKS_MIGRACAO_FRONT_BACK.md`.** Compara o backend atual (PIM III) com o contrato (doc 04) e decide o que **manter / alterar / remover / criar**.
> **Base:** auditoria do código em `backend/` (ASP.NET Core 10, EF Core 10 + SQLite, JWT, FluentValidation, BCrypt, xUnit/Moq, Playwright) — nenhum valor de credencial é reproduzido aqui.

---

## 1. O que existe hoje (5.1)

| Área | Itens atuais |
|---|---|
| **Controllers (9)** | `AuthController` (login/register), `ExpensesController` (CRUD c/ filtros), `IncomesController` (CRUD sem update), `CategoriesController` (CRUD), `ReportsController` (summary/by-category/trend/daily), `AlertsController` (list/read/delete), `InsightsController` (list), `ChatController` (history/send/clear via webhook n8n), `IntegrationController` (API key estática + e-mail) |
| **Entidades (7)** | `User`, `Category` (**global, sem UserId**), `Expense`, `Income`, `Budget` (mês/ano), `Alert`, `ChatMessage` |
| **Application** | 8 services + repositórios manuais (7) + DTOs records/classes + 2 validators FluentValidation (`CreateExpenseValidator`, `CreateCategoryValidator`) |
| **Infrastructure** | `AppDbContext` SQLite; 6 migrations (1 vazia; seed de categorias duplicado); `SeedData` com 5 usuários de teste e 6 meses de dados fictícios; JWT Bearer; BCrypt; CORS (dev liberado demais); **sem Serilog em uso** (pacotes instalados); **sem middleware de exceção** |
| **Testes** | 7 fatos unitários (3 services/validators) + suíte Playwright E2E da SPA; sem testes de controllers/integração; sem CI |
| **Infra** | Dockerfile multi-stage, docker-compose (backend sem porta pública, volume `sqlite_data` **não aproveitado** pela connection string), Nginx proxy `/api`, `.env` exigido mas inexistente no repo |

## 2. Classificação geral — tabela mestre (5.2/5.3)

### 2.1 Manter

| Item | Observação |
|---|---|
| Arquitetura em camadas Domain/Application/Infrastructure/Controllers | atende à Etapa 6 do ROADMAP |
| JWT Bearer + `JwtSecurityTokenHandler` com remapeamento de claims | manter desenho, corrigir fonte do secret |
| BCrypt (hash/verify) | mantém work factor padrão |
| EF Core + SQLite + padrão Repository + DI | mantém; provider segue avaliado no doc 03 §7 |
| FluentValidation (auto-validation) | manter; **expandir** cobertura de validators |
| Swagger/OpenAPI | manter; adicionar Bearer scheme |
| `ExpenseStatus`/`AlertType`/enums existentes | renumerar/renomear conforme doc 03 §5 |
| Guardas de propriedade (`GetCurrentUserId` + checks por service) | manter conceito; promover a base/classe compartilhada (7 controllers duplicam o helper) |
| Docker Compose (frontend como único ponto público + proxy `/api`) | manter modelo de deploy |
| Endpoints de relatórios (summary/by-category/trend/daily) | manter formato; mover p/ `/api/v1`, ajustar payloads ao contrato |

### 2.2 Alterar

| Item atual | Ação |
|---|---|
| Rotas sem versionamento | Prefixo `/api/v1` em todos os controllers |
| `Expenses` + `Incomes` separados | **Unificar em `Transactions`** (doc 03 D1); incluir `PaymentMethod`, `Source`, `ExternalId` |
| `Category` global | Adicionar `UserId`, `Kind`, `IsSystem`, `SortOrder`; clonar templates no register (D2/D3) |
| `Budget` (só mês corrente, sem delete) | Upsert por categoria+período com unique composto + endpoint próprio |
| `Alert` | Adicionar `DedupKey` unique (evita duplicação por POST); DELETE para dispensa; endpoint `unread-count` |
| `ChatController`/`ChatService` (webhook n8n, sem tools) | Substituir por `CopilotController`/`CopilotService` com function calling (`ICopilotAiClient`), `ActionPayload`, cota diária e fallback rule-based (doc 04 §11) |
| `InsightService` hardcoded (limiar fixo) | Recalcular on the fly com as 4 regras do doc 04 §10 |
| `AuthService` | Unificar fonte do secret (env `JWT_SECRET` em emissão **e** validação); mensagem genérica no 401; erros sem `ex.Message` |
| Tratamento de erro (`catch(Exception) → 404`, `ex.Message` vazando) | Middleware global ProblemDetails (RFC 7807) + 404/403/409 corretos |
| CORS dev (`SetIsOriginAllowed(true)+AllowCredentials`) | Restringir às origens do compose/proxy |
| `ReportService.GetTrendAsync` (carrega histórico completo em memória) | Agregar no banco/projeção; incluir `income`/`saved` por período (contrato §8) |
| `Program.cs` | Health check (`/health`), rate limiting (OTP/login/copilot), Swagger com Bearer, opcional `UseSerilog` (pacotes já no csproj) |
| Namespaces DTOs (`Application.DTOs` vs `Application.Dtos`) | Unificar; mover `IntegrationExpenseRequest` para Dtos |
| `User` sem perfil | Adicionar colunas de perfil/preferências (doc 03 §3.1) |
| `AlertsController`/PUTs silenciosos | 404/403 explícitos |
| `ExpenseService.UpdateAsync` (sobrescreve tudo, não valida categoria) | PATCH-like + validação de categoria/tipo |
| docker-compose/volume | Connection string apontando para `/app/data/financeiro.db` (volume `sqlite_data` hoje é ignorado) |
| `GetCurrentUserId` duplicado ×7 | `BaseApiController` com `UserContext` |
| `ChatMessage.Role` string | enum `ChatRole` |

### 2.3 Remover

| Item | Motivo |
|---|---|
| `IntegrationController` (API key estática compartilhada, acesso por e-mail, comparação não constant-time) | Substituído pelo contrato `/api/v1`; se a integração WhatsApp/n8n voltar (ROADMAP), reentra como serviço assinando `ICopilotAiClient` com autenticação adequada |
| Migration vazia `AuthSetup` | Ruído no histórico (banco será recriado — §4) |
| Seed duplicado de categorias (`HasData` + migration) + seed de 6 meses fictícios | Redefinir seed: templates de categorias (não-fixados por Id) + conta demo + dados mínimos de demonstração |
| Pacotes não usados (`CsvHelper`, `Serilog.*` se não adotar, `EFCore.InMemory` nos tests se não usado) | Higiene do csproj (CsvHelper pode reaparecer na importação P2) |
| `RefreshTokenExpirationDays` (config órfã) | Remover ou implementar (P2, doc 03 D9) |
| `UseHttpsRedirection` (Docker HTTP atrás de proxy) | Terminação TLS no proxy |
| Test credentials expostas no README (tabela de senhas em texto plano) | Documentar apenas no seed interna; remover do README na fase de código |

### 2.4 Criar (do zero)

| Item novo | Ref. contrato |
|---|---|
| `OtpController`/`OtpService` + `OtpCodes` + provedor WhatsApp abstraído (simulado em dev) | 04 §2 |
| `UsersController` (me, avatar, password, preferences, reset-data, delete) | 04 §3 |
| `BudgetsController` (upsert/list) | 04 §5 |
| `TransactionsController` (unificada, paginação/filtros/ordenação, `X-Total-Sum`) | 04 §6 |
| `DashboardController` (overview/weekly/recent/meters) | 04 §7 |
| `AlertsController.unread-count` + dedup no `AlertService` | 04 §9 |
| `CopilotController` + tools + `ICopilotAiClient` (provedor LLM via env, fallback rule-based) | 04 §11 |
| `ImportsController` (parse preview + confirm + dedup) | 04 §12 (P2) |
| `ReportsController.export.csv/json` | 04 §8 |
| Middleware de exceção global + rate limiting + health check | 04 §1 |
| Migrations do novo modelo | §4 abaixo |
| Testes: services de auth/copilot/dashboard/budgets, controllers via `WebApplicationFactory` + SQLite in-memory, E2E atualizados | 06 §3 |
| CI (GitHub Actions: build front+back, lint, testes, imagem Docker) | ROADMAP Etapa 8 |
| `.env.example` na raiz (compose exige `.env` inexistente) | §6 |

## 3. Mapeamento contrato (04) → status (aceite: novo × adaptação)

| Endpoint do contrato | Status | Origem |
|---|---|---|
| POST /auth/login, /auth/register | **Adaptação** | `AuthController` atual |
| POST /auth/otp/request, /auth/otp/verify, /auth/demo, /auth/refresh(P2) | **Novo** | — |
| GET/PUT /users/me, avatar, password, preferences, reset-data, DELETE /users/me | **Novo** | — |
| GET/POST/PUT/DELETE /categories | **Adaptação** | `CategoriesController` (ownership + kind) |
| PUT/GET /budgets | **Adaptação** (upsert novo; leitura deriva de `Reports.by-category` atual) | `CategoriesService` (criava budget do mês) |
| GET/POST/PUT/DELETE /transactions | **Adaptação** (unificação de `Expenses`+`Incomes`) | `ExpensesController`, `IncomesController` |
| GET /dashboard/* | **Novo** (agregados antes no front) | — |
| GET /reports/summary, /by-category, /trend, /daily | **Adaptação** | `ReportsController` |
| GET /reports/export.csv, /export.json | **Novo** | — |
| GET /alerts, PUT read, DELETE | **Adaptação** (+dedup, +unread-count novo) | `AlertsController` |
| GET /insights | **Adaptação** (regras recalculadas) | `InsightsController` |
| GET/POST/DELETE /copilot/* | **Adaptação** (substitui `ChatController`; tools novas) | `ChatController` |
| POST /imports/preview, /confirm | **Novo (P2)** | — |

## 4. Estratégia do banco (5.4)

**Decisão: recriar migrations do zero.** Evidências de que **não há dado real a preservar**:

1. `backend/financeiro.db` **não é versionado** (regra `*.db` no `.gitignore`) e contém exatamente o estado gerado por `Migrate() + SeedData` (5 usuários de teste com senhas conhecidas, 7 categorias, ~90 despesas fictícias jan–jun/2026 da persona universitária, ~15 receitas, 36 orçamentos, 2 alertas — todas com timestamps da sessão de seed).
2. Nenhuma tabela/recebeu dados fora do gerador; o e-mail "verificado" e o volume indicam uso exclusivamente de desenvolvimento/apresentação.

Portanto: **drop schema + migrations novas** a partir do modelo do doc 03 (`Transactions` unificada, `Categories` por usuário, `Budgets` com unique composto, `OtpCodes`, `ImportBatches`, `Alerts.DedupKey`, colunas de perfil em `Users`), mantendo o padrão de configuração EF existente (`ApplyConfigurationsFromAssembly`). Novo seed: templates de categorias por usuário + conta demo + massa de demonstração mínima (para prints do relatório PIM). O snapshot antuo é arquivado em `legacy/` junto ao banco atual (backup no repositório de arquivos locais, fora do git).

## 5. Base técnica reaproveitável (5.5)

| Base | Avaliação |
|---|---|
| JWT Bearer (validação + claims) | Reaproveitável — corrigir divergência de secret emissão/validação |
| BCrypt | Reaproveitável |
| EF Core + SQLite + repos + DI | Reaproveitável — modelo novo, mesmos padrões |
| FluentValidation | Reaproveitável — ampliar validators (update/usuarios/auth) |
| Middlewares e pipeline | Base boa; adicionar exceção/rate-limit/health |
| Swagger | Reaproveitável + Bearer scheme |
| Docker/Nginx/compose | Reaproveitável — corrigir volume do SQLite e `.env` |
| Playwright E2E | Reaproveitável — reescrever specs para o app React novo |
| xUnit/Moq | Reaproveitável — ampliar cobertura |
| Webhook n8n (ChatService) | Conceito reaproveitado como implementação alternativa de `ICopilotAiClient` |

## 6. Pendências de segurança (5.6) — resolver na fase de código

| # | Pendência | Ação |
|---|---|---|
| S1 | JWT secret e API key hardcoded em `appsettings.json` **versionado** (já no histórico do git) | Mover p/ env/user-secrets e **rotacionar** os valores atuais; nunca regravá-los em arquivo rastreado |
| S2 | Emissão do token ignora env (só appsettings) × validação prioriza env | Unificar fonte (doc 2.2) |
| S3 | CORS dev: qualquer origem + credenciais | Restringir por ambiente |
| S4 | Categorias globais (cross-tenant) | Corrigido pelo modelo novo (D2) |
| S5 | `IntegrationController` remove na 2.3 | — |
| S6 | `ex.Message` vazando em 401/400/500 | ProblemDetails sem detalhes internos |
| S7 | `.env` exigido pelo compose e inexistente; sem `.env.example` | Criar `.env.example` (chaves vazias) e documentar no README |
| S8 | `financeiro.db` fora do tracking (ok) mas `*.db-journal` não coberto no `.gitignore` | Adicionar padrão; conferir `appsettings.*.local.json` |
| S9 | Seed com senhas de teste + README documentando credenciais | Manter só em dev-seed; remover do README |
| S10 | Comparação de API key não constant-time | Irrelevante após remoção do IntegrationController; novas keys usam `CryptographicOperations.FixedTimeEquals` |
| S11 | Sem rate limiting em auth/OTP | Adicionar (contrato 429) |
| S12 | Uploads (avatar/import) ainda inexistentes | Validar MIME/tamanho/codec no serviço (doc 04 §14) |

## 7. Aceite da etapa

- [x] 5.1 Levantamento do existente (§1)
- [x] 5.2 Classificação manter/alterar/remover (§2)
- [x] 5.3 Criações do zero listadas (§2.4)
- [x] 5.4 Estratégia do banco decidida com evidências (§4)
- [x] 5.5 Base técnica avaliada (§5)
- [x] 5.6 Pendências de segurança (§6)

**Critério de aceite:** todo endpoint do contrato (doc 04) indica se é novo ou adaptação — tabela §3 (16 grupos de endpoint, 9 adaptações, 7 novos).
