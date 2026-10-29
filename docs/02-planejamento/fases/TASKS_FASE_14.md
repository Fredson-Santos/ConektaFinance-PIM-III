# 🚀 Tasks da Fase F14 — Requisitos Técnicos do Manual PIM IV

> **Projeto:** ConektaFinance — PIM IV (UNIP)
> **Status:** F14.1 a F14.14 concluídas `[x]` em 28/10/2026 · F14.15 em andamento (issues #1–#16 criadas; quadro aguardando permissão `project` no `gh`)
> **Fonte dos requisitos:** `docs/00-manual-pim-iv/manual_pim_iv_ads.md` (§ 2.4 Atividades e § 2.5 Critérios de Avaliação) e `docs/02-planejamento/ROADMAP_PIM_IV.md`
> **Área:** Banco de Dados (PostgreSQL) · Backend (ASP.NET Core 10) · Frontend (React 19 + Vite + PWA) · Infra (Docker, GitHub Actions, Dokploy)
> **Padrão de Commits:** Rigorosamente alinhado a `.agents/rules/git.md` (`tipo(escopo): descrição`)
> **Critério de Testes:** 100% de aprovação pré-commit (`dotnet test`, `npm test`, `npm run lint`, `npm run build`) conforme `.agents/rules/tests.md`

> [!NOTE]
> **Escopo deste documento:** apenas o que precisa ser **implementado no código/plataforma** para que o sistema atenda ao que o manual pede.
> A redação do relatório ABNT (Etapas 1, 2, 3 e 9, capítulos, prints e referências) **não** faz parte desta fase — ela consome os artefatos gerados aqui.

---

## 🧭 Diagnóstico: Requisito do Manual × Situação Atual

| Etapa               | Requisito do manual (§ 2.4)                                    | Pontos | Situação no código                                                                                                                  | Tasks                   |
| ------------------- | --------------------------------------------------------------- | :----: | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 4 — Web .NET       | Arquitetura, APIs REST, autenticação, segurança              |  2,0  | ✅ Atendido (API v1, JWT, BCrypt, FluentValidation, ProblemDetails, CORS, rate limiting, 235 testes)                                   | F14.8, F14.9 (reforço) |
| 4 — Web .NET       | **Estrutura administrativa**                              |   —   | ❌ Não existe perfil nem painel de administrador (`AccountType` sempre `Standard`, nenhum `[Authorize(Roles)]`)                 | F14.6, F14.7            |
| 4 — Web .NET       | Integração entre módulos                                     |   —   | ✅ Transações, orçamentos, alertas, relatórios, IA e WhatsApp integrados                                                           | —                      |
| 5 — Mobile         | Telas, navegação, autenticação, integração com APIs       |  2,0  | ✅ PWA instalável, bottom nav, OTP WhatsApp, onboarding                                                                               | —                      |
| 5 — Mobile         | Sincronização de dados |   —   | ➖ Fora do escopo desta fase (decisão da equipe) | — |
| 6 — Arquitetura    | POO, camadas, modularização                                   |   —   | ✅ Domain / Application / Infrastructure / Controllers com DI por interfaces                                                           | —                      |
| 7 — Banco de Dados | Modelo lógico, modelo físico, MER                             |  1,0  | ⚠️ MER apenas em Mermaid (`docs/03-criterios/07-banco-de-dados/DIAGRAMA_ER.md`); diagramas do PIM III defasados                            | F14.5                   |
| 7 — Banco de Dados | **Procedures, triggers e script completo**                |   —   | ❌ Nenhum `.sql`, procedure ou trigger no repositório (runtime em SQLite via EF Core)                                               | F14.1 – F14.4          |
| 3 — Resp. Social   | Recursos inclusivos, acessibilidade, combate à discriminação |  0,5  | ⚠️ ~130 atributos `aria-*`, `prefers-reduced-motion`, tema claro/escuro; sem auditoria WCAG nem diretriz ética explícita na IA | F14.10, F14.11          |
| 8 — Nuvem/DevOps   | Containers, pipeline CI/CD                                      |  0,5  | ⚠️ Dockerfiles + compose + CI (build/lint/test); **sem CD** (publicação de imagem e deploy)                                  | F14.12                  |
| 8 — Nuvem/DevOps   | **Monitoramento, escalabilidade e segurança**            |   —   | ❌ Sem logs estruturados, health check só "ok" estático, sem healthcheck nos containers, sem backup                                  | F14.13, F14.14          |
| 9 — Ágil          | Quadro Kanban e definição das entregas                        |  1,0  | ⚠️ Fases F0–F13 documentadas em Markdown; sem quadro Kanban real como evidência                                                    | F14.15                  |

---

## ⚖️ Decisão: banco usado pela API

**O banco usado pelas APIs continua SQLite ou migra para PostgreSQL?**

O manual pede *"procedures, triggers e script completo do banco de dados **utilizado pelas APIs**, aplicação Web e Mobile"*. O SQLite não suporta stored procedures, e as triggers dele têm sintaxe própria.

| Opção                                                           | Como fica                                                                                    | Prós                                                                                                                       | Contras                                                               |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **A — Migrar o runtime para PostgreSQL** *(recomendada)* | Troca do provider EF Core para Npgsql; script `.sql` aplicado no mesmo banco que a API usa | Atende o manual ao pé da letra; procedures e triggers rodam de verdade sob a API; o compose já tem PostgreSQL (Evolution) | Exige regenerar migrations e ajustar a suíte de integração         |
| **B — Manter SQLite + script PostgreSQL paralelo**         | Decisão registrada na Etapa 7 do `TASKS_MIGRACAO_FRONT_BACK.md`                           | Zero risco ao runtime atual                                                                                                 | A banca pode questionar que o script "não é o banco usado pela API" |

As tasks F14.1 a F14.4 valem para as duas opções. A **F14.4b** só se aplica à Opção A.

> **Decisão tomada em 28/10/2026: Opção A.** A API passou a usar PostgreSQL 16 (Npgsql + convenção `snake_case`). Os testes de integração rodam contra PostgreSQL real via Testcontainers.

### Ajustes feitos durante a implementação

- **Fonte única do schema:** o `01_schema.sql` é **gerado** das migrations do EF Core por `database/build.sh`, e o CI falha se ele estiver desatualizado. Procedures e triggers (`02`/`03`) são idempotentes, embutidas no assembly e aplicadas pela API no startup (`DatabaseProgrammability`), em vez de migration com `migrationBuilder.Sql`.
- **Datas:** foi mantido `timestamp without time zone` com valores em UTC (modo legado do Npgsql), no lugar de `TIMESTAMPTZ`, para não alterar o tratamento de datas já existente no backend.
- **Procedure usada pela API:** o endpoint `POST /api/v1/reports/monthly-closing` executa `sp_fechamento_mensal`.
- **CD (F14.12):** o `docker-compose.yml` continua com `build:`. O pipeline publica as imagens versionadas no GHCR e aciona o webhook do Dokploy (secret `DOKPLOY_DEPLOY_WEBHOOK`), sem arquivo de override, para não alterar o deploy atual.
- **Nginx:** o backend passou a ser resolvido pelo DNS interno do Docker (`resolver 127.0.0.11`), então o proxy continua funcionando quando o container do backend é recriado ou escalado.
- **Cabeçalhos de segurança e correlation id** passaram a ser aplicados com `Response.OnStarting`, para continuarem presentes nas respostas de erro.

---

## 📊 Tabela Consolidada de Tasks

| Status | ID               | Prioridade | Área                      | Tarefa                                                                | Commit Previsto                                                                    |
| :----: | ---------------- | :--------: | -------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
|  [x]  | **F14.1**  |     P1     | `db`                     | Script DDL PostgreSQL completo (schema físico)                       | `db: adiciona script ddl postgresql do modelo conektafinance`                    |
|  [x]  | **F14.2**  |     P1     | `db`                     | Stored procedures de fechamento mensal e verificação de orçamento  | `db: adiciona procedures de fechamento mensal e verificacao de orcamento`        |
|  [x]  | **F14.3**  |     P1     | `db`                     | Triggers de `updated_at`, auditoria e alerta de orçamento          | `db: adiciona triggers de auditoria e alerta de limite orcamentario`             |
|  [x]  | **F14.4**  |     P1     | `db` / `infra`         | Script unificado, seed, testes SQL e job de validação no CI         | `db: unifica script do banco com seed e testes automatizados`                    |
|  [x]  | **F14.4b** |     P1     | `backend` / `db`       | *(Opção A)* Migrar runtime da API para PostgreSQL                 | `feat(backend): migra persistencia da api para postgresql`                       |
|  [x]  | **F14.5**  |     P1     | `db`                     | Diagramas MER, lógico e físico atualizados a partir do modelo atual | `docs(pim-iv): atualiza mer e modelos logico e fisico do banco`                  |
|  [x]  | **F14.6**  |     P1     | `backend`                | Perfil administrador com role, métricas e gestão de usuários       | `feat(backend): adiciona perfil administrador com metricas e gestao de usuarios` |
|  [x]  | **F14.7**  |     P1     | `frontend`               | Painel administrativo `/admin` protegido por role                   | `feat(frontend): implementa painel administrativo com metricas e usuarios`       |
|  [x]  | **F14.8**  |     P2     | `backend` / `infra`    | Cabeçalhos de segurança HTTP na API e no Nginx                      | `feat(backend): adiciona cabecalhos de seguranca http`                           |
|  [x]  | **F14.9**  |     P2     | `backend`                | Documentação completa do Swagger (XML comments e status codes)      | `docs(backend): documenta todos os endpoints no swagger`                         |
|  [x]  | **F14.10** |     P3     | `frontend`               | Auditoria WCAG 2.1 AA com testes automatizados (axe)                  | `test(frontend): adiciona testes automatizados de acessibilidade wcag`           |
|  [x]  | **F14.11** |     P3     | `backend`                | Diretrizes éticas e de não discriminação no agente de IA          | `feat(backend): adiciona diretrizes eticas e de nao discriminacao ao agente`     |
|  [x]  | **F14.12** |     P2     | `infra`                  | Pipeline de CD: publicar imagens no GHCR e acionar deploy             | `infra: adiciona pipeline de cd com publicacao de imagens e deploy`              |
|  [x]  | **F14.13** |     P2     | `backend` / `infra`    | Logs estruturados, correlation id e health checks reais               | `feat(backend): adiciona logs estruturados e health checks de dependencias`      |
|  [x]  | **F14.14** |     P3     | `infra`                  | Healthcheck, limites de recursos e backup no compose                  | `infra: adiciona healthchecks limites de recursos e backup do banco`             |
|  [ ]  | **F14.15** |     P3     | `gestao`                 | Quadro Kanban no GitHub Projects com as tasks F14                     | — *(sem commit; evidência para o relatório)*                                  |

**Prioridades:** P1 = bloqueia nota de critério do manual · P2 = reforça critério já parcialmente atendido · P3 = diferencial / evidência.

**Ordem sugerida de execução:** Decisão A/B → F14.1 → F14.2 → F14.3 → F14.4 → (F14.4b) → F14.5 → F14.6 → F14.7 → F14.8 → F14.9 → F14.12 → F14.13 → F14.14 → F14.10 → F14.11 → F14.15.

---

## 🔍 Detalhamento das Tarefas

## 🗄️ Etapa 7 — Projeto e Programação de Banco de Dados

### Task F14.1 — Script DDL PostgreSQL (Modelo Físico)

#### 1. Contexto e Motivação

O manual exige o **modelo físico** e o **script completo** do banco. Hoje o schema só existe implícito nas configurações Fluent API do EF Core (`backend/Infrastructure/Persistence/Configurations/`).

#### 2. Escopo Técnico

* **Arquivo:** `database/01_schema.sql` (nova pasta `database/` na raiz).
* **Fonte da verdade:** `CoreConfigurations.cs`, `FinanceConfigurations.cs` e o dicionário de dados em `docs/03-criterios/07-banco-de-dados/03_MODELO_DADOS.md`. O script deve espelhar **exatamente** as 8 entidades do `AppDbContext`:
  `users`, `categories`, `budgets`, `transactions`, `alerts`, `chat_messages`, `otp_codes`, `import_batches`.
* **Convenções:**
  - Nomes em `snake_case`; PK `id SERIAL`/`GENERATED ALWAYS AS IDENTITY`.
  - Valores monetários em `NUMERIC(18,2)`; datas em `TIMESTAMPTZ` (UTC).
  - Enums mantidos como `SMALLINT` (mesmo mapeamento numérico do C#: `TransactionType` Expense=0/Income=1, `AlertType` BudgetExceeded=0/CategoryLimit=1/HighExpense=2 etc.) com `CHECK` restringindo os valores válidos e `COMMENT ON COLUMN` explicando cada código.
  - Colunas `created_at` / `updated_at` com `DEFAULT now()` em todas as tabelas que as possuem.
* **Restrições obrigatórias:**
  - FKs com as mesmas regras de exclusão do EF (`ON DELETE CASCADE`, `RESTRICT` para `transactions.category_id` e `SET NULL` para `transactions.import_batch_id` e `alerts.category_id`).
  - `UNIQUE (email)` em `users`; `UNIQUE (user_id, name)` em `categories`; `UNIQUE (user_id, category_id, period_month, period_year)` em `budgets`; `UNIQUE (user_id, external_id)` em `transactions`; `UNIQUE (user_id, dedup_key)` em `alerts`.
  - `CHECK (value > 0)` em `transactions`, `CHECK (limit_value >= 0)` em `budgets`, `CHECK (period_month BETWEEN 1 AND 12)`.
* **Índices:** os mesmos `HasIndex` do EF — `transactions (user_id, transaction_date)`, `chat_messages (user_id)` e `(user_id, channel)`, `otp_codes (phone, created_at)`.
* **Tabelas novas exigidas pelas tasks seguintes** (criar já aqui):
  - `monthly_closings` — consolidado mensal por usuário (F14.2).
  - `audit_log` — trilha de auditoria (F14.3).

#### 3. Critérios de Aceite (DoD)

- [ ] `psql -f database/01_schema.sql` executa sem erros em um PostgreSQL 16 limpo.
- [ ] Todas as 8 entidades + `monthly_closings` + `audit_log` criadas com PK, FK, UNIQUE, CHECK e índices.
- [ ] Script idempotente para ambiente de testes (`DROP SCHEMA IF EXISTS conekta CASCADE; CREATE SCHEMA conekta;` no topo).
- [ ] Cada tabela e coluna relevante com `COMMENT ON` em português (vira dicionário de dados no relatório).

---

### Task F14.2 — Stored Procedures

#### 1. Contexto e Motivação

Requisito explícito do manual (Etapa 7). As regras de negócio já existem em C# e devem ser **replicadas fielmente** no banco, para que o texto do relatório possa demonstrar a equivalência.

#### 2. Escopo Técnico

* **Arquivo:** `database/02_procedures.sql`.
* **`sp_fechamento_mensal(p_user_id INT, p_ano INT, p_mes INT)`** — `PROCEDURE`:
  - Soma receitas (`type = 1`) e despesas (`type = 0`) com `status = 0` (ativas) no período.
  - Calcula saldo, percentual do teto global (`users.monthly_ceiling`) e a categoria de maior gasto.
  - Faz *upsert* em `monthly_closings` (`ON CONFLICT (user_id, ano, mes) DO UPDATE`).
  - Executada via `CALL sp_fechamento_mensal(1, 2026, 10);`.
* **`fn_status_orcamento(p_user_id INT, p_category_id INT, p_ano INT, p_mes INT)`** — `FUNCTION ... RETURNS TABLE(gasto NUMERIC, limite NUMERIC, percentual NUMERIC, status TEXT)`:
  - Mesma regra de `BudgetStatus.EvaluateStatus`: `noLimit` (limite ≤ 0), `over` (> 100%), `warn` (≥ 80%), `ok`.
* **`sp_verificar_orcamento(p_user_id INT, p_category_id INT, p_ano INT, p_mes INT)`** — `PROCEDURE`:
  - Usa `fn_status_orcamento` e insere/atualiza alerta em `alerts` com o **mesmo formato de `dedup_key`** do `AlertService`:
    - `cat:{categoryId}:{ano}-{mes:00}:exceeded` → `type = 0` (BudgetExceeded)
    - `cat:{categoryId}:{ano}-{mes:00}:limit` → `type = 1` (CategoryLimit)
  - `INSERT ... ON CONFLICT (user_id, dedup_key) DO UPDATE` (dedup idêntico ao backend).

#### 3. Critérios de Aceite (DoD)

- [ ] As três rotinas compilam e executam sem erro após o `01_schema.sql`.
- [ ] Resultados batem com os do backend para o mesmo conjunto de dados (validado na F14.4).
- [ ] Cada rotina com bloco de comentário no topo: objetivo, parâmetros, exemplo de chamada.

---

### Task F14.3 — Triggers

#### 1. Contexto e Motivação

Requisito explícito do manual (Etapa 7). Previstas no `ROADMAP_PIM_IV.md`: atualização de timestamp/auditoria e alerta de limite orçamentário.

#### 2. Escopo Técnico

* **Arquivo:** `database/03_triggers.sql`.
* **`trg_set_updated_at`** — `BEFORE UPDATE` em todas as tabelas com `updated_at`; função genérica `fn_set_updated_at()` faz `NEW.updated_at := now()`.
* **`trg_auditoria_transactions`** (e opcionalmente `budgets`) — `AFTER INSERT OR UPDATE OR DELETE`; grava em `audit_log (tabela, operacao, registro_id, user_id, dados_antigos JSONB, dados_novos JSONB, executado_em)` usando `to_jsonb(OLD)` / `to_jsonb(NEW)`.
* **`trg_alerta_orcamento`** — `AFTER INSERT OR UPDATE OF value, category_id, transaction_date, status` em `transactions`, somente quando `NEW.type = 0` (despesa); chama `sp_verificar_orcamento` para a categoria e o mês da transação.

> [!WARNING]
> **Na Opção A (runtime em PostgreSQL)** o `AlertService` e a `trg_alerta_orcamento` gerariam o mesmo alerta. Como ambos usam o mesmo `dedup_key` e `ON CONFLICT`, não há duplicação — mas documente no código qual das duas é a fonte primária e mantenha os testes de `AlertsFlowTests` verdes.

#### 3. Critérios de Aceite (DoD)

- [ ] Atualizar qualquer linha altera `updated_at` automaticamente.
- [ ] INSERT/UPDATE/DELETE em `transactions` gera registro em `audit_log` com o JSON antes/depois.
- [ ] Inserir despesa que leva a categoria a ≥ 80% gera alerta `type = 1`; acima de 100% gera `type = 0`; repetir a operação **não** duplica o alerta.

---

### Task F14.4 — Script Unificado, Seed, Testes SQL e Validação no CI

#### 1. Contexto e Motivação

O manual pede o **script completo**. Além de unificar, o script precisa ser provado executável de forma automática (regra de ouro do `TASKS_MIGRACAO_FRONT_BACK.md`).

#### 2. Escopo Técnico

* **`database/04_seed.sql`** — conta demo + 13 categorias padrão (espelhar `SeedData.cs` e `CategoryTemplates.cs`) + transações e orçamentos de exemplo.
* **`database/conektafinance.sql`** — script único gerado pela concatenação `01` → `04` (script `database/build.sh` ou passo do CI), pronto para anexar ao relatório.
* **`database/tests/`** — scripts de verificação com `DO $$ ... ASSERT ... $$`:
  - `test_procedures.sql`: fechamento mensal confere com somas manuais; `fn_status_orcamento` retorna `ok/warn/over/noLimit` nos limiares 79,99% / 80% / 100% / 100,01%.
  - `test_triggers.sql`: `updated_at`, `audit_log` e dedup de alertas.
* **`database/README.md`** — como executar localmente: `docker run --rm -e POSTGRES_PASSWORD=dev -p 5433:5432 postgres:16-alpine` + `psql`.
* **CI (`.github/workflows/ci.yml`)** — novo job `database` com `services: postgres:16-alpine` executando `conektafinance.sql` e os testes (`psql -v ON_ERROR_STOP=1`).

#### 3. Critérios de Aceite (DoD)

- [ ] `conektafinance.sql` roda do zero sem erros e deixa o banco populado.
- [ ] Todos os `ASSERT` passam; uma falha interrompe o job (`ON_ERROR_STOP=1`).
- [ ] Job `database` verde no GitHub Actions.

---

### Task F14.4b — *(Opção A)* Migrar o Runtime da API para PostgreSQL

#### 1. Contexto e Motivação

Faz com que o script, as procedures e as triggers sejam de fato o banco "utilizado pelas APIs, aplicação Web e Mobile", como pede o manual.

#### 2. Escopo Técnico

* Trocar `Microsoft.EntityFrameworkCore.Sqlite` por `Npgsql.EntityFrameworkCore.PostgreSQL` no `PIM-III-Backend.csproj`; `UseSqlite` → `UseNpgsql` em `Program.cs`.
* Mapear nomes `snake_case` iguais ao `01_schema.sql` (`UseSnakeCaseNamingConvention()` do pacote `EFCore.NamingConventions`) e **recriar as migrations** do zero (base é 100% regenerável de seed — mesma decisão da Etapa 5.4).
* Aplicar `02_procedures.sql` e `03_triggers.sql` via migration (`migrationBuilder.Sql(File.ReadAllText(...))`) para que `dotnet ef database update` entregue o banco completo.
* **Compose:** novo serviço `conekta-postgres` (separado do `evolution-postgres`), volume próprio, `DefaultConnection` via `.env`; remover volume `sqlite_data`; atualizar `.env.example`.
* **Testes:** `CustomWebApplicationFactory` passa a usar PostgreSQL via **Testcontainers** (`Testcontainers.PostgreSql`) — o CI do GitHub Actions já suporta Docker.

#### 3. Critérios de Aceite (DoD)

- [ ] `docker compose up --build` sobe API + PostgreSQL com schema, procedures, triggers e seed aplicados.
- [ ] Suíte `dotnet test` 100% verde contra PostgreSQL.
- [ ] Nenhuma referência residual a SQLite no backend, compose ou `.env.example`.

---

### Task F14.5 — Diagramas MER, Lógico e Físico Atualizados

#### 1. Contexto e Motivação

O manual exige MER, modelo lógico e modelo físico. Os diagramas em `legacy/docs-pim-III/diagramas/` são do modelo antigo (Expenses/Incomes separados) e o Mermaid em `docs/03-criterios/07-banco-de-dados/DIAGRAMA_ER.md` não traz tipos físicos.

#### 2. Escopo Técnico

* **Pasta:** `database/diagramas/`.
* `mer.puml` — modelo conceitual (entidades, relacionamentos e cardinalidades, sem tipos).
* `modelo-logico.puml` — tabelas, PK, FK, atributos e cardinalidades.
* `modelo-fisico.puml` — tipos PostgreSQL, constraints, índices, incluindo `monthly_closings` e `audit_log`.
* Exportar `.png` de cada um (PlantUML) para inserção no relatório.

#### 3. Critérios de Aceite (DoD)

- [ ] Os três diagramas refletem exatamente o `01_schema.sql` (mesmos nomes de tabelas e colunas).
- [ ] PNGs legíveis em página A4 retrato.

---

## 🌐 Etapa 4 — Solução Web (.NET): Estrutura Administrativa e Segurança

### Task F14.6 — Perfil Administrador (Backend)

#### 1. Contexto e Motivação

O manual pede explicitamente **"estrutura administrativa"** na solução Web. Hoje o JWT já é configurado com `RoleClaimType = "role"` (`Program.cs`), mas o `TokenService` emite apenas `accountType`, e nenhum endpoint exige role.

#### 2. Escopo Técnico

* **Domínio:** `User.AccountType` passa a aceitar `Standard` e `Admin`; novo campo `IsActive` (bool, default `true`) + migration.
* **Token:** `TokenService` emite também a claim `role` com o valor de `AccountType`.
* **Seed:** criar admin a partir de variáveis de ambiente (`Admin__Email`, `Admin__Password`) — nunca com senha versionada; documentar no `.env.example`.
* **Bloqueio:** `AuthService.LoginAsync`, `OtpService.VerifyAsync` e `DemoLoginAsync` recusam usuários com `IsActive = false` (403 ProblemDetails).
* **`AdminController`** (`/api/v1/admin`, `[Authorize(Roles = "Admin")]`):
  - `GET /metrics` — total de usuários, ativos nos últimos 30 dias, novos no mês, transações no mês, alertas gerados, interações com a IA (web × WhatsApp).
  - `GET /users?search=&page=&pageSize=` — lista paginada (sem expor `PasswordHash`).
  - `PATCH /users/{id}/status` — ativar/desativar conta (admin não pode desativar a si mesmo).
* **Serviço:** `IAdminService` / `AdminService` na camada Application, seguindo o padrão dos demais serviços.

#### 3. Critérios de Aceite (DoD)

- [ ] Usuário `Standard` recebe **403** em todos os endpoints `/admin`.
- [ ] Conta desativada não consegue autenticar por nenhum dos três fluxos.
- [ ] Testes de integração `AdminFlowTests` cobrindo métricas, paginação, bloqueio e autorização.

---

### Task F14.7 — Painel Administrativo (Frontend)

#### 1. Contexto e Motivação

Interface da estrutura administrativa exigida pelo manual, gerando evidência visual para o relatório.

#### 2. Escopo Técnico

* **Rota:** `/admin` com guarda `RequireRole('Admin')` em `AppRoutes.jsx`; usuário comum é redirecionado ao dashboard.
* **`AuthContext`:** expor `isAdmin` a partir de `user.accountType`.
* **Navegação:** item "Administração" na `Sidebar` e na `CommandPalette`, visível apenas para admin.
* **Tela `AdminScreen`:**
  - Cards de KPI com os dados de `GET /admin/metrics` (reutilizar os componentes de KPI do dashboard).
  - Tabela de usuários com busca, paginação e ação "Ativar/Desativar" com modal de confirmação.
  - Estados de carregamento (skeleton), vazio e erro, como nas demais telas.
* **Serviço:** `adminService` em `src/services/index.js`.

#### 3. Critérios de Aceite (DoD)

- [ ] Usuário comum não vê o menu e não acessa `/admin` digitando a URL.
- [ ] Ativar/desativar reflete na lista sem recarregar a página.
- [ ] Layout responsivo (mobile-first e desktop) e testes em `src/test/admin.test.jsx`.

---

### Task F14.8 — Cabeçalhos de Segurança HTTP

#### 1. Contexto e Motivação

Reforça o item "segurança" da Etapa 4 e o roadmap ("Proteção CORS e cabeçalhos de segurança"). Hoje nem a API nem o Nginx enviam cabeçalhos de segurança.

#### 2. Escopo Técnico

* **API (`Program.cs`):** middleware adicionando `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`; `app.UseHsts()` fora de Development.
* **Nginx (`frontend/nginx.conf`):** os mesmos cabeçalhos + `Content-Security-Policy` compatível com o SPA (`default-src 'self'`; `img-src 'self' data: blob:`; `connect-src 'self'`; liberar apenas as origens de fontes realmente usadas). Usar `add_header ... always` e repetir nos blocos `location` que já declaram `add_header`.
* **Swagger:** habilitável fora de Development por configuração (`Swagger__Enabled=true`) para a demonstração à banca, desligado por padrão em produção.

#### 3. Critérios de Aceite (DoD)

- [ ] `curl -I` na API e no frontend exibe todos os cabeçalhos.
- [ ] PWA, gráficos, exportação PDF e upload de imagem continuam funcionando com a CSP ativa (sem erros no console).
- [ ] Teste de integração verificando os cabeçalhos em uma resposta da API.

---

### Task F14.9 — Documentação Completa do Swagger

#### 1. Contexto e Motivação

Roadmap: "Swagger / OpenAPI documentando 100% dos endpoints". Os controllers não têm XML comments nem `ProducesResponseType`.

#### 2. Escopo Técnico

* `<GenerateDocumentationFile>true</GenerateDocumentationFile>` no `.csproj` + `options.IncludeXmlComments(...)` no `AddSwaggerGen`.
* `/// <summary>` em português em todos os controllers e actions; `[ProducesResponseType]` para 200/201/204/400/401/403/404/409/429 conforme o contrato (`docs/03-criterios/04-solucao-web/04_CONTRATO_API.md`).
* Agrupamento por tags (Auth, Transações, Orçamentos, Admin, Copilot, WhatsApp...).

#### 3. Critérios de Aceite (DoD)

- [ ] Todo endpoint aparece no Swagger com descrição e códigos de resposta.
- [ ] Build sem novos warnings de documentação ausente (`CS1591`) nos controllers.

---

## 🤝 Etapa 3 — Responsabilidade Social, Diversidade e Acessibilidade

### Task F14.10 — Auditoria WCAG 2.1 AA com Testes Automatizados

#### 1. Contexto e Motivação

O manual pede "recursos tecnológicos inclusivos" e "ações voltadas à acessibilidade". O código já tem boa base (aria, reduced motion, temas), mas falta **comprovação objetiva**.

#### 2. Escopo Técnico

* Adicionar `vitest-axe` (ou `jest-axe`) e criar `src/test/a11y.test.jsx` rodando axe nas telas: login, onboarding, dashboard, gastos, orçamentos, relatórios, configurações e admin.
* Corrigir todas as violações encontradas (contraste nos dois temas, labels, landmarks, ordem de headings).
* **Skip link** "Pular para o conteúdo" no `AppLayout`.
* Garantir alvos de toque ≥ 44×44 px na `BottomNav`, chips e botões de ícone.
* Rodar Lighthouse (Accessibility) em mobile e registrar a pontuação (meta ≥ 95) para o relatório.

#### 3. Critérios de Aceite (DoD)

- [ ] Zero violações axe de impacto *serious* ou *critical* nas telas listadas.
- [ ] Navegação completa por teclado com foco visível em todas as telas.
- [ ] Testes de acessibilidade rodando no CI.

---

### Task F14.11 — Diretrizes Éticas e de Não Discriminação no Agente de IA

#### 1. Contexto e Motivação

Etapa 3 cita "combate à discriminação" e o roadmap prevê "princípios éticos de IA (ausência de vieses discriminatórios)". O agente já tem defesa contra prompt injection (`docs/03-criterios/04-solucao-web/07_AGENTE_IA.md`), mas não tem diretriz explícita de não discriminação.

#### 2. Escopo Técnico

* Acrescentar ao system prompt do Copilot (`CopilotService` / `CopilotClients.cs`) regras explícitas:
  - Não inferir nem usar raça, etnia, gênero, religião, orientação sexual, deficiência ou origem nas respostas e recomendações.
  - Linguagem simples, respeitosa e neutra, sem jargão bancário excludente.
  - Não oferecer recomendação de crédito nem julgamento moral sobre gastos.
* Registrar as diretrizes em `docs/03-criterios/04-solucao-web/07_AGENTE_IA.md` (seção "Ética e não discriminação").

#### 3. Critérios de Aceite (DoD)

- [ ] Teste unitário garantindo que o prompt de sistema contém as diretrizes.
- [ ] Teste adversarial com o cliente de IA simulado (mock, regra `tests.md`): pergunta com viés discriminatório recebe recusa educada e neutra.

---

## ☁️ Etapa 8 — Infraestrutura em Nuvem e DevOps

### Task F14.12 — Pipeline de CD (Publicação de Imagens e Deploy)

#### 1. Contexto e Motivação

O manual pede **pipeline CI/CD**. O `ci.yml` atual cobre apenas CI (build, lint e testes).

#### 2. Escopo Técnico

* Novo workflow `.github/workflows/cd.yml`, disparado em push na `main` **após o CI verde** (`workflow_run` ou `needs`).
* `docker/login-action` + `docker/build-push-action` publicando `ghcr.io/<owner>/conektafinance-backend` e `-frontend` com tags `latest` e `sha-<commit>`.
* Acionar o deploy no Dokploy via webhook guardado em `secrets.DOKPLOY_DEPLOY_WEBHOOK` (nunca no YAML).
* Ajustar `docker-compose.yml` para usar as imagens publicadas em produção (mantendo `build:` em um `docker-compose.override.yml` para desenvolvimento local).

#### 3. Critérios de Aceite (DoD)

- [ ] Merge na `main` publica as duas imagens no GHCR e dispara o deploy automaticamente.
- [ ] Falha no CI impede a publicação.
- [ ] Nenhum segredo versionado (verificação obrigatória do `git.md`).

---

### Task F14.13 — Logs Estruturados, Correlation ID e Health Checks Reais

#### 1. Contexto e Motivação

O manual pede **monitoramento**. Hoje `/health` devolve sempre `ok` sem checar dependências, e os logs são texto livre do `ILogger` padrão.

#### 2. Escopo Técnico

* **Serilog** (`Serilog.AspNetCore`) com saída JSON no console (coletável pelo Docker/Dokploy) e `UseSerilogRequestLogging()` (método, rota, status, duração).
* Middleware de **correlation id**: lê ou gera `X-Correlation-Id`, devolve na resposta e anexa ao contexto de log; o `ErrorHandlingMiddleware` inclui o id no ProblemDetails.
* **Health checks** (`AddHealthChecks`):
  - `/health/live` — processo de pé.
  - `/health/ready` — banco (`AddDbContextCheck<AppDbContext>`) + Evolution API (check HTTP com timeout curto, status *Degraded* se indisponível).
  - Manter `/health` como alias de `/health/live` para não quebrar o que já usa a rota.
* Nunca registrar senha, token, código OTP ou conteúdo de mensagens do WhatsApp.

#### 3. Critérios de Aceite (DoD)

- [ ] Cada requisição gera uma linha JSON com `CorrelationId`.
- [ ] `/health/ready` retorna 503 com o banco indisponível.
- [ ] Testes cobrindo correlation id e os endpoints de health.

---

### Task F14.14 — Healthcheck, Limites de Recursos e Backup no Compose

#### 1. Contexto e Motivação

Cobre **escalabilidade** e **segurança/continuidade** da Etapa 8 com evidências concretas na infraestrutura.

#### 2. Escopo Técnico

* `healthcheck:` no `docker-compose.yml` para `backend` (`/health/live`), `frontend` e banco; `depends_on: condition: service_healthy`.
* `deploy.resources.limits` (CPU/memória) para cada serviço.
* Serviço de **backup** do banco (`pg_dump` diário com retenção de 7 arquivos em volume dedicado — ou cópia do SQLite na Opção B).
* Backend sem estado em disco além do banco e dos uploads, permitindo escalar réplicas atrás do Traefik (documentar a limitação dos uploads em volume local).

#### 3. Critérios de Aceite (DoD)

- [ ] `docker compose ps` mostra todos os serviços como `healthy`.
- [ ] Backup gerado e restaurado com sucesso em um banco limpo (procedimento documentado em `database/README.md`).

---

## 📋 Etapa 9 — Gerenciamento Ágil (Evidência na Plataforma)

### Task F14.15 — Quadro Kanban no GitHub Projects

#### 1. Contexto e Motivação

O manual pede quadro Kanban e definição das entregas. Um quadro real, com histórico, é evidência mais forte no relatório do que uma tabela desenhada.

#### 2. Escopo Técnico

* Criar um GitHub Project (visão *Board*) com as colunas **Backlog · To Do · In Progress · Review/Test · Done**.
* Uma issue por task F14 (título = ID + nome; corpo = critérios de aceite deste documento), com labels de área (`db`, `backend`, `frontend`, `infra`) e prioridade (`P1`–`P3`).
* Campo *Sprint* (iteration) agrupando as tasks em sprints com datas.
* Vincular os commits/PRs às issues (`refs #N`) para rastreabilidade.

#### 3. Critérios de Aceite (DoD)

- [ ] Todas as tasks F14 representadas no quadro com sprint e responsável.
- [ ] Capturas do quadro em pelo menos dois momentos (início e fim da fase) para o relatório.

---

## 🛠️ Instruções de Execução e Qualidade

> [!IMPORTANT]
> ### 🛑 REGRA DE OURO: TESTE OBRIGATÓRIO AO FINAL DE CADA TASK
>
> Mesma regra das fases anteriores (`TASKS_MIGRACAO_FRONT_BACK.md`):
> `Desenvolver` ➔ `Escrever/Atualizar Testes` ➔ `Validar localmente` ➔ `Testar manualmente` ➔ `Marcar [x]` ➔ `Commit atômico (git.md)`.

| Área        | Validação obrigatória antes do commit                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------- |
| `db`       | Executar `database/conektafinance.sql` + `database/tests/*.sql` em PostgreSQL 16 limpo, com `ON_ERROR_STOP=1` |
| `backend`  | `dotnet test` 100% verde; serviços externos (IA, WhatsApp) sempre mockados                                       |
| `frontend` | `npm test`, `npm run lint` e `npm run build` sem erros; conferir no navegador em mobile (< 880px) e desktop   |
| `infra`    | `docker compose up --build` limpo, todos os serviços `healthy`, proxy `/api` funcionando                     |

**Segurança (git.md § 5):** nenhuma credencial, senha de admin, webhook ou connection string versionada — tudo via `.env` / GitHub Secrets, com placeholder no `.env.example`.

**Ao concluir cada task:** marcar `[x]` aqui e o item correspondente em `docs/02-planejamento/ROADMAP_PIM_IV.md`, e guardar as evidências (prints, saída de testes, PNG dos diagramas) para o capítulo da etapa no relatório.
