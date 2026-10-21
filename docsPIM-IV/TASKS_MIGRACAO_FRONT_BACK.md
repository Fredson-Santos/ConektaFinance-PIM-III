# Tasks de Planejamento e Implementação — Migração do Front para React e Refação do Backend

> **Escopo deste documento:** Rastreamento unificado do ciclo de vida da migração: **Planejamento (Etapas 1–7 — Concluído)** e **Execução/Implementação (Fases F0–F12 — F0 a F11 concluídas; F12 dispensada pelo time)**.
> **Fonte da verdade e especificação:** Protótipo em `docsPIM-IV/prototipo/index.html` e especificações técnicas em `docsPIM-IV/planejamento/`.
> **Direção técnica:** React + Vite (SPA/PWA) no front · ASP.NET Core (.NET 10) no back · EF Core + SQLite · Nginx + Docker.

**Legenda:** `[ ]` pendente · `[x]` concluído

> **Status Atual (20/10/2026):**
> - **Planejamento (Etapas 1–7):** **100% Concluído e Aprovado**.
> - **Implementação (Fases F0–F11):** **100% Concluída** — backend com 133 testes verdes (`dotnet test`), frontend com 61 testes verdes (`npm test` + `npm run build`), 30 commits atômicos no padrão do `git.md`.
> - **Fase F12 (evidências e manual):** **Dispensada pela equipe** em 20/10/2026.

---

## 📊 Visão Geral do Planejamento (Etapas 1–7)

| # | Etapa | Entregável | Depende de | Status |
|---|---|---|---|---|
| 1 | Inventário do protótipo | `docsPIM-IV/planejamento/01_INVENTARIO_FRONT.md` | — | **Concluído** |
| 2 | Plano de componentização React | `docsPIM-IV/planejamento/02_PLANO_COMPONENTES.md` | 1 | **Concluído** |
| 3 | Modelo de dados & MER | `docsPIM-IV/planejamento/03_MODELO_DADOS.md` + `diagramas/DIAGRAMA_ER.md` | 1 | **Concluído** |
| 4 | Contrato da API REST | `docsPIM-IV/planejamento/04_CONTRATO_API.md` | 1, 3 | **Concluído** |
| 5 | Análise do backend atual (gap) | `docsPIM-IV/planejamento/05_GAP_BACKEND.md` | 3, 4 | **Concluído** |
| 6 | Plano de implementação e testes | `docsPIM-IV/planejamento/06_PLANO_IMPLEMENTACAO.md` | 2, 4, 5 | **Concluído** |
| 7 | Revisão e aprovação formal | Registro de decisões abaixo (§ Etapa 7) | 1–6 | **Concluído** |

---

## Detalhamento das Etapas de Planejamento (Concluídas)

### Etapa 1 — Inventário do protótipo (`index.html`)
- [x] 1.1 Listar todas as telas e seções (Dashboard, Transações, Orçamentos, Copilot IA, Configurações, modais)
- [x] 1.2 Mapear para cada tela: dados exibidos, ações do usuário e estados (vazio, loading, erro)
- [x] 1.3 Marcar as funcionalidades novas em relação ao backend atual (N1 a N17)
- [x] 1.4 Identificar dados que vivem no JS/`localStorage` e precisam ir para o servidor
- [x] 1.5 Extrair regras de negócio embutidas no JS (limites, alertas 80/100, totais)
- [x] 1.6 Separar itens exclusivos de interface (tema, modo discreto, PWA, animações do FAB)
- [x] 1.7 Mapear o CSS: tokens do design system (`--ds-*`), temas dark/light e breakpoints

### Etapa 2 — Plano de componentização React
- [x] 2.1 Definir a árvore de componentes (layout, telas, modais, botão flutuante de IA, gráficos)
- [x] 2.2 Identificar componentes reutilizáveis e seus props
- [x] 2.3 Definir o mapa de rotas (`/login`, `/dashboard`, `/transacoes`, etc.) com guards
- [x] 2.4 Definir gestão de estado (Theme, Auth, Ui, Toast, DataContexts e custom hooks)
- [x] 2.5 Definir estrutura de pastas do frontend
- [x] 2.6 Definir estratégia de CSS (tokens, base global e arquivos por componente)
- [x] 2.7 Avaliar `frontend/src/` atual (o que aproveitar e o que descartar)
- [x] 2.8 Definir camada de serviços (`services/` e `mocks/` espelhando contrato)
- [x] 2.9 Listar dependências a adicionar (`react-router-dom`, `recharts`, `vitest`, testing library)

### Etapa 3 — Modelo de dados
- [x] 3.1 Derivar entidades e atributos a partir do inventário (`Users`, `Categories`, `Budgets`, `Transactions`, `Alerts`, `ChatMessages`, `OtpCodes`, `ImportBatches`, `RefreshTokens`)
- [x] 3.2 Definir relacionamentos, chaves compostas e regras de exclusão (cascade/restrict)
- [x] 3.3 Definir tipos e regras de domínio (valores como `decimal(18,2)`, datas ISO 8601 UTC)
- [x] 3.4 Definir estratégia de auditoria (`CreatedAt`/`UpdatedAt`) e exclusão física/lógica
- [x] 3.5 Avaliar banco de dados (SQLite mantido com paridade para script DDL corporativo)
- [x] 3.6 Produzir o diagrama ER em Mermaid (`diagramas/DIAGRAMA_ER.md`)

### Etapa 4 — Contrato da API
- [x] 4.1 Definir convenções: base `/api/v1`, JWT Bearer, RFC 7807 ProblemDetails, paginação e ordenação
- [x] 4.2 Listar endpoints por tela com requisição, resposta e status codes
- [x] 4.3 Definir endpoints agregados do dashboard (overview, weekly, recent, meters)
- [x] 4.4 Definir contrato do Copilot IA com function calling (`actions` para o front), sem streaming na v1
- [x] 4.5 Definir autorização por recurso (filtro estrito por `sub` do JWT)
- [x] 4.6 Especificar contrato em Markdown (`04_CONTRATO_API.md`)
- [x] 4.7 Validar montagem integral de todas as telas a partir das respostas

### Etapa 5 — Análise do backend atual (gap)
- [x] 5.1 Levantar o que existe no backend (controllers, entidades, serviços, validators, migrations, seed)
- [x] 5.2 Classificar itens em manter, alterar e remover
- [x] 5.3 Listar itens a criar do zero
- [x] 5.4 Decidir estratégia de banco: recriar migrations do zero (base atual é 100% regenerável de seed)
- [x] 5.5 Avaliar base técnica reaproveitável (.NET 10, EF Core, JWT, BCrypt, Docker, Nginx)
- [x] 5.6 Mapear e planejar mitigação das 12 pendências de segurança (S1 a S12)

### Etapa 6 — Plano de implementação e testes
- [x] 6.1 Ordenar recursos por prioridade técnica e dependência (F0 a F12)
- [x] 6.2 Quebrar em tasks pequenas e atômicas por área com critérios de aceite (DoD)
- [x] 6.3 Definir estratégia de testes: Vitest no front, xUnit no back, mocks estritos para serviços externos
- [x] 6.4 Definir integração desacoplada via adaptadores mock do contrato
- [x] 6.5 Estimar esforço e mapear riscos
- [x] 6.6 Definir mensagens de commit conforme regra `git.md`

---

## Etapa 7 — Revisão e Aprovação Formal

- [x] 7.1 Revisão do grupo sobre inventário, modelo de dados e contrato
- [x] 7.2 Fechar e homologar decisões pendentes (tabela abaixo)
- [x] 7.3 Registrar aprovação formal e liberar o início da implementação

### Registro de Decisões Aprovadas

| Item | Decisão Homologada | Justificativa Técnica |
|---|---|---|
| **Provedor de IA** | Abstração via interface `ICopilotAiClient` com fallback rule-based e cota diária de requisições. | Permite troca transparente de LLM via variáveis de ambiente, sem streaming na v1 e sem quebra caso a API externa falhe. |
| **Banco de Dados** | Manter SQLite no runtime (EF Core + volume Docker) e gerar script DDL corporativo (PostgreSQL/SQL Server) com Triggers/Procedures para o PIM IV. | Garante portabilidade leve no Docker local e atende 100% aos critérios formais de avaliação da banca da UNIP (Etapa 7 do ROADMAP). |
| **Dados Anteriores** | Recriação completa das migrations do zero (`drop database`). | O banco legado continha apenas dados fictícios de seed. Não há dados reais de usuários a preservar. |
| **Divisão de Escopo** | **P1 Prioritário:** Fases F0 a F9 + F11 (Fundações, Auth, Categorias, Transações, Orçamentos, Dashboard, Alertas, Copilot, Relatórios, Perfil e PWA).<br>**P2 Secundário:** Fase F10 (Importação OFX, Exportação CSV e Zona de Perigo). | Garante a entrega do core financeiro completo e navegável dentro do prazo acadêmico do PIM. |

---

# 🚀 Fases de Implementação (F0 a F12)

> [!IMPORTANT]
> ### 🛑 REGRA DE OURO: TESTE OBRIGATÓRIO AO FINAL DE CADA TASK
> **Nenhuma task pode ser marcada como pronta (`[x]`) nem commitada sem a validação prática e automatizada do que foi implementado!**
>
> Ao término do código de **cada tarefa individual**, deve-se executar o roteiro de testes correspondente à sua área:
> 1. **Backend (`backend`):**
>    - Executar `dotnet test` na pasta `backend/` garantindo 100% de sucesso na suíte de testes.
>    - Testar manualmente os endpoints novos/alterados via Swagger (`/swagger`) ou cliente HTTP (verificando retornos 200/201 e tratamento de erros 400/401/403/404/409).
>    - Assegurar que serviços externos (IA, WhatsApp) permaneçam estritamente mockados na suíte de testes (regra `tests.md`).
> 2. **Frontend (`frontend`):**
>    - Executar `npm test` na pasta `frontend/` cobrindo componentes, hooks e fluxos criados.
>    - Executar `npm run build` na pasta `frontend/` para atestar ausência de quebras de empacotamento.
>    - Validar a interface no navegador/emulador: estados de carregamento (skeleton), estado vazio, sucesso e erros, além do comportamento responsivo mobile-first (<880px) e desktop.
> 3. **Banco de Dados (`db`):**
>    - Aplicar e validar as migrations limpas (`dotnet ef database update`).
>    - Testar integridade referencial, chaves compostas e carga correta do seed.
> 4. **Infraestrutura & Docker (`infra`):**
>    - Validar subida limpa dos containers via `docker compose up --build`.
>    - Testar comunicação do proxy Nginx `/api` com o backend e persistência dos dados no volume SQLite.
>
> **Fluxo Obrigatório de Conclusão de Toda Task:**
> `Desenvolver Feature/Fix` ➔ `Escrever/Atualizar Testes` ➔ `Executar Validação Local (dotnet test / npm test / build)` ➔ `Testar Manualmente o Cenário` ➔ `Marcar [x] na Task` ➔ `Commit Atômico (git.md)`.

> [!CAUTION]
> ### 🧹 HIGIENE DO REPOSITÓRIO: REMOÇÃO OBRIGATÓRIA DE CÓDIGO MORTO E LEGADO
> **É terminantemente proibido manter arquivos órfãos, código morto/comentado ou estruturas legadas substituídas no repositório.**
>
> A cada etapa de implementação, o código substituído deve ser **imediatamente excluído** (nunca renomeado para `.bak`, `.old` ou mantido comentado):
> 1. **No Frontend (`frontend/src/`):**
>    - **Remover lixo de template Vite:** excluir `App.css`, `assets/react.svg`, `assets/vite.svg`, `assets/hero.png`.
>    - **Excluir views e contextos obsoletos:** descartar `views/CopilotView.jsx` (o chat de IA agora é overlay global `AiPanel`), `context/FinanceContext.jsx` (substituído por contexts modulares e services) e navegações legadas baseadas em `activeTab`.
>    - **Eliminar seletores e CSS órfãos:** remover referências inexistentes identificadas no inventário (`#tx-body-full`, `.spark`, classes e listeners sem alvo no DOM).
> 2. **No Backend (`backend/`):**
>    - **Remover endpoints obsoletos/inseguros:** excluir `IntegrationController.cs` (API key estática compartilhada legada).
>    - **Excluir código segregado substituído:** após a unificação em `Transactions`, remover entidades, controllers, DTOs e repositórios antigos de `Expenses` e `Incomes` segregados.
>    - **Substituir chat antigo:** remover `ChatController.cs` e `ChatService.cs` baseados em webhook cru n8n sem function calling (substituídos por `CopilotController` + `ICopilotAiClient`).
>    - **Limpeza de banco e migrations:** descartar migrations legadas e vazias (como `AuthSetup`), seeds duplicados e colunas órfãs.
>    - **Higiene de dependências:** remover pacotes não utilizados no `.csproj` (`CsvHelper` não utilizado, Serilog se não configurado) e configs órfãs no `appsettings.json`.

```
F0 Fundações → F1 Auth → F2 Categorias → F3 Transações → F4 Orçamentos
→ F5 Dashboard → F6 Alertas → F7 Copilot IA → F8 Relatórios → F9 Configurações
→ F10 P2 (Import/Export/Perigo) → F11 Polish/PWA → F12 Docs Acadêmicas
```

---

### Fase F0 — Fundações (Infraestrutura, Banco e Base do Projeto)

| Status | ID | Área | Tarefa | Critério de Aceite (DoD) | Commit Previsto |
|:---:|---|---|---|---|---|
| [x] | F0.1 | `db` | Implementar novo modelo de dados (entidades, enums e configurações Fluent API do doc 03) | Projeto compila; índices únicos e FKs mapeados; migration inicial gerada sem erros | `db: cria modelo unificado de transacoes, categorias por usuario e otp` |
| [x] | F0.2 | `db` | Configurar migrations limpas e novo seed (descartar migrations antigas/vazias e banco legado) | Banco sobe limpo com `dotnet ef database update`; categorias padrão e conta demo criadas | `db: recria migrations do zero e substitui seed por categorias padrao e conta demo` |
| [x] | F0.3 | `backend` | Criar `BaseApiController` com injeção de `UserContext` | `GetCurrentUserId` centralizado; controllers herdando da base sem duplicação de claims | `refactor(backend): centraliza contexto de usuario em base controller` |
| [x] | F0.4 | `backend` | Implementar middleware global de erros com ProblemDetails (RFC 7807) | Respostas 400/401/403/404/409 padronizadas; zero vazamento de stack trace ou dados internos | `feat(backend): adiciona middleware global de erros com problemdetails` |
| [x] | F0.5 | `backend` | Configurar segurança base: JWT unificado por env var, CORS restrito e rate limiting | Secrets fora do código versionado; CORS configurado por ambiente; endpoints de auth protegidos | `fix(backend): unifica secret jwt por variavel de ambiente e restringe cors` |
| [x] | F0.6 | `backend` | Versionar API com prefixo `/api/v1`, Swagger com suporte a Bearer token e endpoint `/health` | Swagger permite autenticação Bearer; rota `/health` responde status 200 | `feat(backend): versiona api em v1 e adiciona health check` |
| [x] | F0.7 | `infra` | Criar `.env.example` na raiz e alinhar persistência do SQLite no Docker Compose | `docker compose up` roda sem arquivos locais extras; dados persistem no volume | `infra: corrige persistencia do sqlite no compose e adiciona env example` |
| [x] | F0.8 | `frontend` | Estruturar projeto React: router, layout base, tokens/base.css e remoção de lixo de template | Exclui `App.css`, `assets/react.svg`, `assets/vite.svg`, `assets/hero.png`; layout funcional | `feat(frontend): estrutura app react com rotas e design system do prototipo` |
| [x] | F0.9 | `frontend` | Configurar ambiente de testes: Vitest, Testing Library e script `npm test` | Teste de fumaça inicial passando com 100% de sucesso via `npm test`; coverage ativo | `test(frontend): configura vitest e testing library com script npm test` |
| [x] | F0.10 | `infra` | Criar pipeline de CI com GitHub Actions (build e testes automatizados de front e back) | Pipeline executa `dotnet test` e `npm test` em cada push/PR, bloqueando em caso de erro | `infra: adiciona pipeline ci com builds e testes de backend e frontend` |

---

### Fase F1 — Autenticação & Usuários

| Status | ID | Área | Tarefa | Critério de Aceite (DoD) | Commit Previsto |
|:---:|---|---|---|---|---|
| [x] | F1.1 | `backend` | Adaptar `POST /auth/login` e `/auth/register` na v1 com clone de categorias padrão | Retorno de JWT com claims corretas; registro clona 13 categorias; testes de serviço ok | `feat(backend): migra autenticacao para v1 com clone de categorias padrao` |
| [x] | F1.2 | `backend` | Implementar serviço e endpoints de OTP WhatsApp (`request` e `verify`) | Expiração de 5 min, janela de reenvio de 45s (retorno 429 se violada) e limite de 3 tentativas | `feat(backend): implementa login via whatsapp com otp e reenvio controlado` |
| [x] | F1.3 | `backend` | Implementar endpoint de acesso rápido para demonstração (`POST /auth/demo`) | Autentica usuário demo pré-semeado retornando token válido | `feat(backend): adiciona acesso rapido de demonstracao` |
| [x] | F1.4 | `frontend` | Construir `AuthScreen` com tabs WhatsApp, e-mail e botão demo | Suporte a máscara de telefone, caixas OTP com suporte a colar, timer de reenvio e validações | `feat(frontend): implementa tela de login com otp whatsapp, email e demo` |
| [x] | F1.5 | `frontend` | Implementar `AuthContext`, guarda de rotas (`RequireAuth`) e interceptador de 401 | Sessão persistida; redirecionamento automático para `/login` em caso de token expirado | `feat(frontend): adiciona guardiao de rota e contexto de autenticacao` |

---

### Fase F2 — Categorias

| Status | ID | Área | Tarefa | Critério de Aceite (DoD) | Commit Previsto |
|:---:|---|---|---|---|---|
| [x] | F2.1 | `backend` | Implementar CRUD de categorias isolado por usuário (`/api/v1/categories`) | Filtros por `kind` (despesa/receita); unicidade por nome/usuário; bloqueio 409 em uso | `feat(backend): torna categorias por usuario com kind e validacoes` |
| [x] | F2.2 | `frontend` | Construir tela de Categorias e Orçamentos (`BudgetsScreen`) com consolidado | Exibição de cards por categoria com badges de status (80%/100%), progresso e consolidado | `feat(frontend): implementa tela de categorias com grade e consolidado` |
| [x] | F2.3 | `frontend` | Adicionar modal de criação e edição de categoria com feedback de conflito | Criação, atualização e exclusão funcionando; modal de aviso quando categoria estiver em uso | `feat(frontend): adiciona gestao de categorias na tela de orcamentos` |

---

### Fase F3 — Transações (Receitas e Despesas Unificadas)

| Status | ID | Área | Tarefa | Critério de Aceite (DoD) | Commit Previsto |
|:---:|---|---|---|---|---|
| [x] | F3.1 | `backend` | Implementar `TransactionsController` unificada (excluir controllers e DTOs de Expenses/Incomes) | Paginação, filtros e `X-Total-Sum`; remove código segregado legado; testes de integração | `feat(backend): unifica lancamentos em transacoes com filtros e paginacao` |
| [x] | F3.2 | `frontend` | Construir tela de Gastos (`TransactionsScreen`) com agrupamento por data e filtros | Transações agrupadas por dia com soma do grupo; filtros por chips e navegação mensal real | `feat(frontend): implementa historico de gastos com filtros e agrupamento` |
| [x] | F3.3 | `frontend` | Implementar `TransactionSheet` (bottom sheet para despesas e receitas) | Alternância de tipo adaptando categorias e cores; parser monetário pt-BR; validações inline | `feat(frontend): adiciona sheet de novo lancamento com suporte a receitas` |
| [x] | F3.4 | `frontend` | Implementar fluxo de detalhe, edição e exclusão de transações | Clique na transação permite visualizar, alterar valores/categorias ou excluir com atualização | `feat(frontend): permite editar e excluir transacoes do historico` |

---

### Fase F4 — Orçamentos

| Status | ID | Área | Tarefa | Critério de Aceite (DoD) | Commit Previsto |
|:---:|---|---|---|---|---|
| [x] | F4.1 | `backend` | Implementar endpoints de orçamentos (`PUT/GET /budgets`) com upsert por período | Upsert idempotente de teto por categoria/mês/ano; status de consumo calculado (ok/warn/over) | `feat(backend): implementa tetos por categoria com upsert de periodo` |
| [x] | F4.2 | `frontend` | Integrar configuração de teto orçamentário diretamente nos cards de categoria | Ação "Definir teto" atualiza limites e reflete instantaneamente nos medidores e consolidado | `feat(frontend): permite configurar tetos orcamentarios por categoria` |

---

### Fase F5 — Dashboard Analítico

| Status | ID | Área | Tarefa | Critério de Aceite (DoD) | Commit Previsto |
|:---:|---|---|---|---|---|
| [x] | F5.1 | `backend` | Implementar agregados de dashboard (`overview`, `weekly`, `recent`, `meters`) | Endpoints devolvem saldo, % do teto, gráfico semanal e top categorias calculados no servidor | `feat(backend): expoe agregados do dashboard com comparativo mensal` |
| [x] | F5.2 | `frontend` | Construir `DashboardScreen` responsiva (mobile-first e desktop) | Renderização fiel ao protótipo: cards de KPI, gráfico da semana, medidores e lançamentos recentes | `feat(frontend): implementa dashboard mobile e desktop com dados da api` |

---

### Fase F6 — Alertas e Notificações

| Status | ID | Área | Tarefa | Critério de Aceite (DoD) | Commit Previsto |
|:---:|---|---|---|---|---|
| [x] | F6.1 | `backend` | Implementar deduplicação de alertas (`DedupKey`), contagem de não lidas e dispensa | Geração automática de alertas em 80% e 100% do teto; endpoint `unread-count`; dispensa via DELETE | `feat(backend): elimina duplicacao de alertas e adiciona contador nao lidas` |
| [x] | F6.2 | `frontend` | Construir `NotificationsPopover` integrado ao sino da barra superior | Badge com contagem de alertas ativos; listagem de notificações com ações de marcar lida e dispensar | `feat(frontend): implementa central de alertas com contador e dispensa` |

---

### Fase F7 — Copilot IA (Assistente Financeiro com Function Calling)

| Status | ID | Área | Tarefa | Critério de Aceite (DoD) | Commit Previsto |
|:---:|---|---|---|---|---|
| [x] | F7.1 | `backend` | Implementar `ICopilotAiClient` (remover IntegrationController e ChatController com n8n legado) | Arquitetura plugável para LLM; fallback rule-based funcional; cota diária; mock em testes | `feat(backend): abstrai cliente de ia com fallback baseado em regras` |
| [x] | F7.2 | `backend` | Implementar endpoints do Copilot com tools e emissão de `ActionPayload` | Tools de resumo, detalhamento por categoria e rascunho de transação (sem inserção direta no banco) | `feat(backend): adiciona copilot com function calling e acoes para o front` |
| [x] | F7.3 | `frontend` | Construir assistente de IA com FAB flutuante arrastável e execução de ações | Chat flutuante em overlay com sugestões dinâmicas; clique em ação abre `TransactionSheet` pré-preenchido | `feat(frontend): implementa assistente de ia com fab arrastavel e acoes` |

---

### Fase F8 — Relatórios Consolidados

| Status | ID | Área | Tarefa | Critério de Aceite (DoD) | Commit Previsto |
|:---:|---|---|---|---|---|
| [x] | F8.1 | `backend` | Implementar endpoints de relatórios (`summary`, `by-category`, `trend`, `daily`) | Agregações de banco de dados para evolução de 6 meses (receitas/despesas/saldo) e comparativo mensal | `feat(backend): revisa relatorios com comparativo de periodo e series 6m` |
| [x] | F8.2 | `frontend` | Construir tela de Relatórios (`ReportsScreen`) com Recharts | Gráficos de barras duplas, donut de composição de gastos, área 6M e tabela de categorias com tendências | `feat(frontend): implementa relatorios com graficos e comparativos` |

---

### Fase F9 — Configurações e Perfil

| Status | ID | Área | Tarefa | Critério de Aceite (DoD) | Commit Previsto |
|:---:|---|---|---|---|---|
| [x] | F9.1 | `backend` | Implementar endpoints de perfil, preferências e troca de senha (`/users/me`) | Atualização de dados pessoais, upload de avatar (≤ 2MB), parâmetros de ciclo/teto e troca de senha | `feat(backend): expoe perfil, preferencias e troca de senha do usuario` |
| [x] | F9.2 | `frontend` | Construir `SettingsScreen` com 3 abas e integração com Modo Discreto | Abas Geral, Senha e Privacidade; toggle de Modo Discreto aplicando máscara monetária globalmente | `feat(frontend): implementa configuracoes com perfil, senha e privacidade` |

---

### Fase F10 — Escopo P2 (Importações, Exportações e Zona de Perigo)

| Status | ID | Área | Tarefa | Critério de Aceite (DoD) | Commit Previsto |
|:---:|---|---|---|---|---|
| [x] | F10.1 | `backend` | Implementar endpoints de importação de extratos (`preview` e `confirm`) com dedup | Parse de OFX/CSV/XLSX; sugestão automática de categoria; deduplicação baseada em `ExternalId` | `feat(backend): importa extratos com categorizacao sugerida e dedup` |
| [x] | F10.2 | `backend` | Implementar exportação CSV de relatórios e endpoints da zona de perigo | Exportação em formato pt-BR; rotas para resetar lançamentos e exclusão de conta em cascata | `feat(backend): adiciona exportacao csv e zona de perigo da conta` |
| [x] | F10.3 | `frontend` | Construir `ImportSheet` com dropzone e opções de conciliação | Drag & drop de arquivos bancários; preview de lançamentos; confirmação com feedback em toast | `feat(frontend): adiciona importacao de extratos, exportacao e zona de perigo` |
| [x] | F10.4 | `frontend` | Adicionar exportação de relatórios em PDF no cliente (`jspdf`) | Geração de documento PDF contendo resumo, gráficos e balanço sem depender do backend | `feat(frontend): exporta relatorio mensal em pdf no cliente` |

---

### Fase F11 — Command Palette, Polimento e PWA

| Status | ID | Área | Tarefa | Critério de Aceite (DoD) | Commit Previsto |
|:---:|---|---|---|---|---|
| [x] | F11.1 | `frontend` | Construir Command Palette (`CommandPalette`) com atalho de teclado `/` | Navegação rápida entre telas, disparo de ações frequentes e busca unificada por comandos | `feat(frontend): adiciona paleta de comandos com atalho de teclado` |
| [x] | F11.2 | `frontend` | Padronizar acessibilidade (WCAG 2.1), foco visível e estados globais de UI | Alvos de toque com no mínimo 44x44px; navegação acessível por teclado; skeletons consistentes | `feat(frontend): padroniza estados de carregamento, erro e vazio nas telas` |
| [x] | F11.3 | `frontend` | Realizar auditoria e testes do PWA (manifest, service worker e safe areas) | Instalação verificada em Android/iOS standalone; cache de assets estáticos; pontuação alta no Lighthouse | `feat(pwa): revisa instalacao, cache offline e safe areas do pwa` |

---

### Fase F12 — Documentação Acadêmica & Entregáveis PIM IV

> **Dispensada pela equipe em 20/10/2026.** As capturas de evidência podem ser geradas pelo time com `npx playwright test specs/04-capturas.spec.ts` (stack local: `dotnet run` + `npm run dev`).

| Status | ID | Área | Tarefa | Critério de Aceite (DoD) | Commit Previsto |
|:---:|---|---|---|---|---|
| [ ] | F12.1 | `docs` | Capturar evidências visuais (Swagger, PWA mobile e telas) para o relatório ABNT | Imagens organizadas por etapa do roadmap prontas para inserção nos capítulos da monografia | `docs(pim-iv): atualiza evidencias de telas e api para o relatorio` |
| [ ] | F12.2 | `docs` | Atualizar manual do usuário com os novos fluxos de autenticação e navegação | Documento com guia passo a passo refletindo o sistema final em produção | `docs: revisa manual do usuario para o novo frontend` |
