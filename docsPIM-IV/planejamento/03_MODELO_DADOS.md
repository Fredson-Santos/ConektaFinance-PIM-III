# 03 — Modelo de Dados

> **Etapa 3 do `TASKS_MIGRACAO_FRONT_BACK.md`.** Entidades que o backend redesenhado precisará persistir.
> **Derivado de:** inventário do protótipo (01) e contrato da API (04). Diagrama ER em `planejamento/diagramas/DIAGRAMA_ER.md`.

---

## 1. Princípios e convenções (3.3)

- **Valores monetários:** `decimal(18,2)` (EF Core `HasPrecision(18,2)`); nunca `float`. Entradas e despesas são guardadas **positivas**; o sinal deriva do `type`.
- **Datas/horas:** UTC no banco (`DateTime.UtcNow`); na API trafegam em **ISO 8601** (`2026-10-20T14:30:00Z`); datas de transação guardam também dia local do usuário (o agrupamento por dia do protótipo exige isso).
- **Enums:** persistidos como `int` com nome do domínio; na API trafegam como `string` (`"expense"`, `"income"`, `"manual"`, `"import"`).
- **Chaves:** `Id: int` autoincrement (identidade). FKs com índice.
- **Ownership:** todo dado de negócio tem `UserId`; consultas sempre filtram por ele (autorização por recurso, doc 04 §7).
- **Names:** tabelas em plural (`Users`, `Transactions`), colunas em PascalCase (padrão atual do projeto).
- **Sem credenciais aqui:** nenhuma secret/connection string neste documento.

## 2. Decisões estruturais (3.1)

| # | Decisão | Justificativa (origem no protótipo) |
|---|---|---|
| D1 | **Unificar despesa e receita em uma única entidade `Transaction`** (campo `type`) | o sheet do protótipo é um só (`#sheetExpense` com toggle despesa/entrada); dashboard soma entradas e saídas do mesmo conjunto; evita endpoints e agregados duplicados. Substitui `Expenses` + `Incomes` do back atual |
| D2 | **`Category` passa a ser por usuário** (`UserId`) | corrige o risco cross-tenant do back atual (categorias globais); protótipo tem listas distintas de categorias de despesa (7) e de entrada (6) → campo `kind` |
| D3 | **Categorias padrão clonadas no cadastro** | ao registrar, o usuário recebe as 7 de despesa + 6 de entrada do protótipo (`categories`, `expenseCategories`, `incomeCategories`) como cópias editáveis |
| D4 | **`Budget` = teto por categoria/mês/ano** (upsert) | protótipo tem limite por categoria e teto geral mensal; período explícito permite navegar meses (hoje o back só cria o do mês corrente) |
| D5 | **`Insight` não é persistido** — calculado on the fly pelo serviço | protótipo exibe insights estáticos; gerá-los na leitura evita tabela/staleness. (Revisar se a Etapa 7 pedir histórico) |
| D6 | **`OtpCode` persistida** para login WhatsApp | fluxo OTP (solicitação, expiração 5 min, reenvio 45 s, tentativas) exige estado no servidor; em dev o código pode ser retornado/logado |
| D7 | **`ImportBatch` + `Transaction.Source/ExternalId`** para importação de extratos | preview, categorização automática e "ignorar duplicidades" (doc 01 §5.6) precisam de rastreabilidade e dedup |
| D8 | **Perfil e preferências dentro de `User`** (colunas) | Configurações do protótipo (nome exibição, telefone, CPF, ocupação, avatar, teto geral, moeda, dia do ciclo) são 1:1 — não justifica tabela própria |
| D9 | **`RefreshToken` fica como P2 (opcional)** | JWT access 60 min hoje; refresh melhora UX no PWA. Decisão final em 7.2 |
| D10 | **`Alert` ganha dispensa** (DELETE) e dedup por (categoria, tipo, mês) | popover do protótipo tem botão dispensar; back atual gera alertas duplicados a cada POST |

## 3. Dicionário de dados

### 3.1 `Users`
| Coluna | Tipo | Obrig. | Regras |
|---|---|---|---|
| Id | int PK | sim | identity |
| FullName | string(255) | sim | nome completo (Configuracoes) |
| DisplayName | string(120) | não | nome de exibição ("Fredson" no protótipo; saudação "Olá, Fred") |
| Email | string(255) | sim | **unique index**; login e-mail |
| Phone | string(20) | não | E.164 ou formato BR; login WhatsApp/OTP |
| Cpf | string(14) | não | exibido oculto (`***.456.789-**`) |
| Occupation | string(120) | não | "Desenvolvedor de Software" |
| AvatarUrl | string(500) | não | caminho do upload (JPG/PNG/WebP ≤ 2MB) |
| PasswordHash | string | sim | BCrypt (work factor padrão) |
| AccountType | string(20) | sim | default "Standard" (mantém claim atual; sem uso funcional) |
| MonthlyCeiling | decimal(18,2) | sim | teto geral mensal ("R$ 8.380,00") |
| Currency | string(3) | sim | default "BRL" |
| CycleStartDay | int | sim | 1–28, default 1 ("Dia 01 de cada mês") |
| CreatedAt / UpdatedAt | DateTime | sim | UtcNow |

### 3.2 `Categories`
| Coluna | Tipo | Obrig. | Regras |
|---|---|---|---|
| Id | int PK | sim | identity |
| UserId | int FK → Users | sim | **cascade**; ownership (D2) |
| Name | string(100) | sim | unique composto (UserId, Name) |
| Description | string(300) | não | "Restaurantes, supermercados…" |
| ColorCode | string(7) | sim | regex `^#([A-Fa-f0-9]{6})$`; default por template |
| Icon | string(40) | sim | id do símbolo SVG do sprite |
| Kind | enum `CategoryKind` | sim | `Expense(0)` / `Income(1)` |
| IsSystem | bool | sim | true se veio do template no cadastro (pode ser editada/excluída igualmente) |
| SortOrder | int | sim | ordem de exibição nos pills |
| CreatedAt / UpdatedAt | DateTime | sim | — |

### 3.3 `Budgets`
| Coluna | Tipo | Obrig. | Regras |
|---|---|---|---|
| Id | int PK | sim | identity |
| UserId | int FK → Users | sim | cascade |
| CategoryId | int FK → Categories | sim | cascade; categoria `Kind=Expense` |
| LimitValue | decimal(18,2) | sim | ≥ 0 (0 = sem teto, como "educacao" no protótipo) |
| PeriodMonth | int | sim | 1–12 |
| PeriodYear | int | sim | ≥ 2026 |
| CreatedAt / UpdatedAt | DateTime | sim | **unique composto (UserId, CategoryId, PeriodMonth, PeriodYear)** (upsert) |

### 3.4 `Transactions` (unificada — D1)
| Coluna | Tipo | Obrig. | Regras |
|---|---|---|---|
| Id | int PK | sim | identity |
| UserId | int FK → Users | sim | cascade |
| CategoryId | int FK → Categories | sim | **restrict** (bloqueia exclusão de categoria em uso) |
| Type | enum `TransactionType` | sim | `Expense(0)` / `Income(1)` |
| Description | string(255) | sim | não vazio |
| Value | decimal(18,2) | sim | > 0 (positivo sempre) |
| TransactionDate | DateTime | sim | não futura (regra atual do back; valida contra o ciclo) |
| PaymentMethod | enum `PaymentMethod`, nullable | não | `Cartao, Pix, Boleto, Debito, Dinheiro, Transferencia, Outro` (subtítulos "Cartão", "Pix", "Boleto"…) |
| Observation | string(500) | não | — |
| IsRecurrent | bool | sim | default false ("Débito automático · Recorrente") |
| Status | enum `TransactionStatus` | sim | `Active(0)` / `Cancelled(1)` |
| Source | enum `TransactionSource` | sim | `Manual(0)` / `Import(1)` / `Copilot(2)` |
| ImportBatchId | int? FK → ImportBatches | não | quando criada via importação |
| ExternalId | string(100) | não | id do extrato p/ **dedup** (unique composto UserId+ExternalId) |
| CreatedAt / UpdatedAt | DateTime | sim | — |

### 3.5 `Alerts`
| Coluna | Tipo | Obrig. | Regras |
|---|---|---|---|
| Id | int PK | sim | identity |
| UserId | int FK → Users | sim | cascade |
| Type | enum `AlertType` | sim | `BudgetExceeded(0)` (>100%), `CategoryLimit(1)` (≥80%), `HighExpense(2)` |
| Title | string(120) | sim | "Moradia — 87% do teto" |
| Message | string(300) | sim | "Restam R$ 180,00 até o fechamento" / "Orçamento excedido em R$ 60,00" |
| CategoryId | int? FK → Categories | não | seta null se categoria excluída |
| IsRead | bool | sim | default false |
| DedupKey | string(60) | sim | ex. `categoria:{id}:{mes}:{tipo}` — **unique composto (UserId, DedupKey)** evita duplicados (D10) |
| CreatedAt / UpdatedAt | DateTime | sim | — |

### 3.6 `ChatMessages`
| Coluna | Tipo | Obrig. | Regras |
|---|---|---|---|
| Id | int PK | sim | identity |
| UserId | int FK → Users | sim | cascade |
| Role | enum `ChatRole` | sim | `User(0)` / `Assistant(1)` (hoje é string) |
| Content | string(4000) | sim | não vazio |
| ActionPayload | string(1000), nullable | não | JSON serializado de function calling (ex.: `{"tool":"open_transaction_sheet","type":"expense","category":"alimentacao","value":45.9}`) |
| CreatedAt | DateTime | sim | — |

### 3.7 `OtpCodes`
| Coluna | Tipo | Obrig. | Regras |
|---|---|---|---|
| Id | int PK | sim | identity |
| Phone | string(20) | sim | índice (Phone, CreatedAt) |
| CodeHash | string | sim | hash do código (nunca texto puro na API em produção) |
| ExpiresAt | DateTime | sim | CreatedAt + 5 min |
| ConsumedAt | DateTime? | não | preenchido na verificação |
| Attempts | int | sim | 0–3; invalida após 3 |
| Purpose | enum `OtpPurpose` | sim | `Login(0)` (extensível p/ confirmações) |
| CreatedAt | DateTime | sim | reenvio só após 45 s do último (regra do timer do protótipo) |

### 3.8 `ImportBatches` (P2 — se importação entrar no escopo)
| Coluna | Tipo | Obrig. | Regras |
|---|---|---|---|
| Id | int PK | sim | identity |
| UserId | int FK → Users | sim | cascade |
| FileName | string(255) | sim | "extrato_setembro_nubank.ofx" |
| DetectedCount / ImportedCount / SkippedDuplicates | int | sim | preview/resultado |
| AutoCategorize / IgnoreDuplicates | bool | sim | opções do sheet |
| Status | enum `ImportStatus` | sim | `Pending(0)` / `Confirmed(1)` / `Failed(2)` |
| CreatedAt | DateTime | sim | — |

### 3.9 `RefreshTokens` (P2 — opcional, ver 7.2)
| Coluna | Tipo | Obrig. | Regras |
|---|---|---|---|
| Id | int PK | sim | identity |
| UserId | int FK → Users | sim | cascade |
| Token | string(200) | sim | unique; hash do refresh token |
| ExpiresAt | DateTime | sim | 7 dias (config já existe no back) |
| RevokedAt | DateTime? | não | logout/rotação |

## 4. Relacionamentos e cardinalidades (3.2)

| Relação | Cardinalidade | Comportamento de exclusão |
|---|---|---|
| User × Category | 1:N | cascade (excluir conta remove categorias) |
| User × Budget | 1:N | cascade |
| User × Transaction | 1:N | cascade |
| User × Alert | 1:N | cascade |
| User × ChatMessage | 1:N | cascade |
| User × OtpCode | 1:N | cascade |
| User × ImportBatch | 1:N | cascade |
| Category × Budget | 1:N | cascade |
| Category × Transaction | 1:N | **restrict** (categoria com lançamentos não pode ser excluída → 409 na API) |
| Category × Alert | 0:N (nullable) | **set null** |
| ImportBatch × Transaction | 0:N | set null (batch pode ser descartado; transações permanecem) |

## 5. Enums

| Enum | Valores | Uso |
|---|---|---|
| `CategoryKind` | `Expense(0)`, `Income(1)` | D2/D3 |
| `TransactionType` | `Expense(0)`, `Income(1)` | D1 |
| `TransactionStatus` | `Active(0)`, `Cancelled(1)` | já existe no back |
| `TransactionSource` | `Manual(0)`, `Import(1)`, `Copilot(2)` | D7 |
| `PaymentMethod` | `Cartao(0)`, `Pix(1)`, `Boleto(2)`, `Debito(3)`, `Dinheiro(4)`, `Transferencia(5)`, `Outro(6)` | subtítulos do protótipo |
| `AlertType` | `BudgetExceeded(0)`, `CategoryLimit(1)`, `HighExpense(2)` | já existe (renumerar `CategoryLimit` p/ coerência) |
| `ChatRole` | `User(0)`, `Assistant(1)` | substitui string atual |
| `OtpPurpose` | `Login(0)` | N1 |
| `ImportStatus` | `Pending(0)`, `Confirmed(1)`, `Failed(2)` | P2 |

## 6. Auditoria e exclusão (3.4)

- **Auditoria:** `CreatedAt`/`UpdatedAt` (UTC) em todas as entidades de negócio; atualização automática no `SaveChanges` (interceptor). Log estruturado (Serilog) de eventos sensíveis: login, OTP, reset de dados, exclusão de conta. **Nenhum dado sensível em log.**
- **Exclusão — por recurso:**
  - `Transaction`: **física** (o protótipo não prevê lixeira; o React do PIM III já exclui direto). `Status=Cancelled` fica apenas para cancelamento semântico futuro.
  - `Category`: **física, bloqueada** se houver transações (409 com sugestão de recategorizar ou excluir em cascata **escolhida pelo usuário**).
  - `Budget`: física (upsert/remove).
  - `Alert`: física (dispensa = DELETE; marcar lida ≠ excluir).
  - `ChatMessage`: física (limpar histórico).
  - `User` (excluir conta — zona de perigo): **física com cascade** + exclusão do avatar; sem soft-delete (escopo PIM).
  - "Redefinir registros financeiros": remove `Transactions`, `Budgets`, `Alerts` do usuário (mantém categorias) — endpoint dedicado.

## 7. O SQLite atende? (3.5)

**Recomendação: manter SQLite nesta fase.** Justificativa: escala acadêmica (dezenas de usuários, single VPS, 1 writer), zero custo/instalação no Docker (volume já previsto no compose), o banco atual é 100% regenerável (não há dado real a preservar — ver doc 05 §5) e o EF Core abstrai o provider (troca futura por PostgreSQL = trocar provider + migrations). **Contrapartidas aceitas:** locks de escrita (mitigados por transações curtas), ausência de procedures/triggers nativos (a Etapa 7 do ROADMAP exige SP/trigger — gerar DDL equivalente num script `.sql` homologável para SGBD corporativo a partir do modelo). Decisão final registrada em 7.2.

## 8. Diagrama ER (3.6)

Arquivo: `planejamento/diagramas/DIAGRAMA_ER.md` (Mermaid `erDiagram` — renderiza no GitHub). Contém as 9 entidades com atributos-chave, PKs/FKs e cardinalidades.

## 9. Rastreabilidade — dado exibido no front → origem no modelo (aceite 3)

| Dado exibido (doc 01) | Origem |
|---|---|
| Nome de exibição / avatar / e-mail verificado / telefone / CPF / ocupação | `Users` |
| Teto geral, moeda, dia do ciclo | `Users.MonthlyCeiling/Currency/CycleStartDay` |
| Saldo, entradas, saídas, % do teto, gráfico semana, barras 6M, donuts, KPIs | Agregados de `Transactions` (± `Budgets`) calculados pelo backend (doc 04) |
| Lista de gastos, filtros, agrupamento por data | `Transactions` (+ `Categories` para ícone/cor) |
| Categorias do sheet (despesa/entrada) | `Categories` por `Kind` |
| Tetos por categoria, medidores, "Disponível/Excesso", badges 80/100 | `Budgets` + soma de `Transactions` do período |
| Alertas do sino (título, mensagem, não lidas, dispensa) | `Alerts` |
| Insights IA e respostas do Copilot | cálculo do serviço de insights + `ChatMessages` (histórico) |
| Ação "criar transação" via IA | `ChatMessages.ActionPayload` (function calling) |
| Histórico do chat IA | `ChatMessages` |
| Login WhatsApp (código, expiração, reenvio, tentativas) | `OtpCodes` |
| Importação (preview, dedup, contadores) | `ImportBatches` + `Transactions.Source/ExternalId` |
| Comparativo com mês anterior / tendências | Agregados de `Transactions` entre períodos |
| Tema, modo discreto, FAB, cmdk, PWA | **sem backend** (front/localStorage) |
