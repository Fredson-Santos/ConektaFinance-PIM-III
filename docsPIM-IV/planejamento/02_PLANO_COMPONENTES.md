# 02 — Plano de Componentização React

> **Etapa 2 do `TASKS_MIGRACAO_FRONT_BACK.md`.** Desenho "no papel" da migração do protótipo para React + Vite. Nenhum código é criado nesta fase.
> **Fonte:** inventário (01_INVENTARIO_FRONT.md) + `frontend/src/` atual.

---

## 1. Princípios

1. O protótipo é a especificação visual/funcional; o design system (tokens `--ds-*`) é transportado 1:1.
2. Mobile-first com desktop progressivo (breakpoint 880px), PWA obrigatório (VitePWA já configurado).
3. Toda regra de negócio exibida sai do backend (doc 04); o front não recalcula saldo/totais.
4. Nenhum termo acadêmico em interface (regra `dev.md`); linguagem de produto SaaS.
5. Todo componente testável (regra `tests.md`: Vitest + Testing Library).

## 2. Mapa de rotas (2.3)

React Router (`react-router-dom`) com rotas declaradas em `src/routes/AppRoutes.jsx` e `RequireAuth` (guard de sessão):

| Rota | Tela | Protegida? | Correspondente no protótipo |
|---|---|---|---|
| `/login` | AuthScreen | Não (redirect se logado) | `#viewAuth` |
| `/` → `/dashboard` | DashboardScreen | Sim | `page-dashboard` |
| `/transacoes` | TransactionsScreen | Sim | `page-gastos` |
| `/categorias` | BudgetsScreen | Sim | `page-categorias` |
| `/relatorios` | ReportsScreen | Sim | `page-relatorios` |
| `/configuracoes` | SettingsScreen | Sim | `page-configuracoes` |
| `*` | NotFoundScreen | — | (novo, fallback) |

- **Copilot IA NÃO é rota**: é overlay global (FAB + painel sobre qualquer tela), fiel ao protótipo.
- Sub-abas de Configurações viram `?tab=geral|senha|privacidade` (query string, mantém deep-link).
- Login por WhatsApp/e-mail/demo são "modos" internos de `/login` (passos, não rotas).
- Redirect: sessão inválida → `/login?redirect=<rota>`.

## 3. Árvore de componentes (2.1)

```
App
├── Providers: ThemeProvider · AuthProvider · ToastProvider · UiContext
├── <LoginLayout>                          (rota /login)
│   └── AuthScreen
│       ├── AuthTabs (WhatsApp | E-mail)
│       ├── WhatsAppOtpFlow
│       │   ├── PhoneStep (PhoneInput + máscara + botão enviar)
│       │   └── OtpStep (OtpBoxes · ResendTimer · botões)
│       ├── EmailLoginForm
│       ├── QuickDemoButton
│       └── AuthFooterNote
├── <AppLayout>                            (rotas protegidas)
│   ├── Sidebar                            (desktop ≥880px)
│   │   ├── Brand · NavItem×4 · NewEntryCta
│   │   └── SidebarFooter → UserTrigger + UserPopover + ThemePill
│   ├── Topbar
│   │   ├── PageHeader (título/subtítulo por rota)
│   │   ├── SearchTrigger ("/" abre CommandPalette)
│   │   ├── NotificationsBell → NotificationsPopover
│   │   ├── ImportButton · NewEntryButton · MobileUserButton
│   ├── BottomNav                          (mobile <880px) → Início · Gastos · FabNewEntry · Categorias · Relatórios
│   ├── <Outlet/>  (telas)
│   ├── AiFab + AiPanel (overlay global, arrastável)
│   ├── TransactionSheet (overlay)
│   ├── ImportSheet (overlay)
│   ├── CommandPalette (overlay)
│   ├── Backdrop · ToastContainer
│   └── PwaInstallBanner
├── DashboardScreen
│   ├── MobileDashboard (GreetingHeader · BalanceCard · DeltaBadge · IncomeExpenseCards · WeeklyBarChart
│   │    · SegmentedControl · AiInsightCard · CategoryRows · RecentTransactions)
│   └── DesktopDashboard (StatGrid (StatCard×3) · ChartCard (WeeklyBarChart) · BudgetMetersCard
│        · RecentTransactionsTable)
├── TransactionsScreen
│   ├── TransactionsHeader (SearchInput · CategoryChips · MonthNavigation · TransactionsSummary)
│   ├── TransactionGroups → TransactionRow×N (ícone, subtítulo, valor, modo discreto)
│   ├── EmptyState
│   └── DesktopSideCol (LimitUsageCard · TopCategoriesCard · QuickActionsCard)
├── BudgetsScreen
│   ├── BudgetsToolbar (título + NewCategoryButton)
│   ├── BudgetOverviewCard (total gasto/limite, progresso global, badge, restante, distribuição)
│   └── CategoryCardGrid → CategoryCard×N (badge de status · mini-barra · disponível/excesso · link extrato)
├── ReportsScreen
│   ├── MobileReports (PeriodSelector · SavingsKpiCard · InOutBarChart · SpendingDonut · MonthComparisonCard · AiInsightCard · ExportPdfButton)
│   └── DesktopReports (ReportsToolbar (period selects · ExportPdfButton · ExportCsvButton) · KpiGrid (KpiCard×3)
│        · SixMonthsTrendChart · SpendingDonut · AiInsightsCard · CategoryPerformanceTable)
├── SettingsScreen
│   ├── SettingsTabs (geral | senha | privacidade)
│   ├── ProfileSettingsTab (AvatarField · ProfileForm · BudgetParametersForm)
│   ├── PasswordSettingsTab (PasswordForm + PasswordStrengthMeter)
│   ├── PrivacySettingsTab (DiscreetModeToggle · ImportExportCard · DangerZoneCard)
└── NotFoundScreen
```

**Overlays compartilhados** (montados no AppLayout, abertos via UiContext): `TransactionSheet`, `ImportSheet`, `CommandPalette`, `NotificationsPopover`, `AiPanel`, `UserPopover`.

## 4. Componentes reutilizáveis e props (2.2)

| Componente | Props principais | Observações |
|---|---|---|
| `Button` | `variant` (primary/secondary/ghost/danger/whatsapp), `size`, `loading`, `icon`, `fullWidth` | estados: loading com spinner |
| `Badge` | `variant` (ok/warn/bad/neutral), `children` | status 80%/100% do doc 01 §5.2 |
| `Input` / `SearchInput` / `PhoneInput` | `label`, `error`, `hint`, `mask` | máscara de telefone embutida |
| `OtpBoxes` | `length=6`, `value`, `onChange`, `onComplete`, `autoFocus` | suporte a colar |
| `SegmentedControl` | `options`, `value`, `onChange` | Semana/Mês, período |
| `Chip` / `CategoryChips` | `active`, `onClick`, `options` | filtros de Gastos |
| `Sheet` (bottom sheet/modal) | `open`, `onClose`, `title`, `children` | translateY 0.28s, foco, Escape, backdrop |
| `Popover` | `open`, `anchor`, `onClose`, `children` | notificações, usuário |
| `Progress` / `Meter` | `value`, `max`, `tone` (ok/warn/bad/category color) | barras de orçamento |
| `Donut` | `slices` [{value,color,label}], `centerLabel` | conic-gradient ou Recharts Pie |
| `BarChart` | `data`, `highlightIndex`, `formatValue` | Recharts; semana e entradas/saídas |
| `LineAreaChart` | `series`, `months`, tooltip custom | gráfico 6M |
| `TrendBadge` | `direction`, `value` | tabela de relatórios |
| `MoneyText` | `value`, `signed`, `discreet` | formata pt-BR; respeita modo discreto (máscara `R$ •••`) |
| `EmptyState` | `icon`, `title`, `description`, `action` | unificar com `#empty` |
| `Skeleton` | `variant` (text/card/table) | **novo**: protótipo não tem loading |
| `ErrorState` | `message`, `onRetry` | **novo** |
| `Toast` / `ToastContainer` | via `useToast()` | 3,5 s, empilhado |
| `Avatar` | `name`, `src`, `size` | iniciais quando sem foto |
| `AiFab` / `AiPanel` | `open`, `onToggle` | FAB arrastável com inércia/snap |
| `CommandPalette` | `commands`, `onSelect` | atalho `/`, filtro |
| `PwaInstallBanner` | (already exists) | manter |

## 5. Gestão de estado (2.4)

| Escopo | Mecanismo | Conteúdo |
|---|---|---|
| **Global (Context)** | `ThemeContext` | tema + persistência `conekta_theme` (corrigir leitura no boot) |
| | `AuthContext` | user, token (memória + `localStorage`), login/logout, `isAuthenticated`, hydrate no boot |
| | `UiContext` | overlays abertos (sheet/palette/notif/ai), modo discreto, FAB posição |
| | `ToastContext` | fila de toasts |
| **Servidor (dados)** | `DataContext` + hooks | cache de categorias/perfil; telas com dados próprios usam hooks |
| **Local de tela (useState/useMemo)** | por componente | filtros de Gastos (texto, categoria, mês), passo do OTP, período de Relatórios, formulários |
| **Hooks customizados** | `useTransactions(filters)`, `useDashboard(period)`, `useReports(period)`, `useAlerts()`, `useCopilot()`, `useDiscreetMode()`, `useMediaQuery('(max-width: 880px)')`, `useOtp()` | encapsulam chamadas a `services/` + loading/erro |
| **URL** | React Router | rota ativa, `?tab=` de configurações |

- Estados de loading/erro/vazio são **obrigatórios** em toda listagem (Skeleton + ErrorState + EmptyState) — fecha a lacuna §10.6 do inventário.
- Estado de servidor é revalidado após mutações (criar transação → invalidar dashboard/transações/alertas). P2 opcional: `@tanstack/react-query`.

## 6. Estrutura de pastas (2.5)

```
frontend/src/
├── main.jsx
├── App.jsx                       (compose providers + Router)
├── routes/
│   └── AppRoutes.jsx             (rotas + RequireAuth)
├── assets/                       (ícones svg, logos)
├── styles/
│   ├── tokens.css                (variáveis --ds-*, temas, breakpoints)
│   └── base.css                  (reset, tipografia, safe areas, scrollbar)
├── components/
│   ├── common/                   (Button, Badge, Input, Sheet, Popover, Progress, MoneyText,
│   │                              EmptyState, Skeleton, ErrorState, SegmentedControl, Chip,
│   │                              Avatar, Toast, OtpBoxes, TrendBadge)
│   ├── layout/                   (AppLayout, LoginLayout, Sidebar, Topbar, BottomNav,
│   │                              UserPopover, NotificationsBell+Popover, PwaInstallBanner)
│   ├── charts/                   (BarChart, Donut, LineAreaChart, Meter)
│   ├── ai/                       (AiFab, AiPanel, AiMessages, AiSuggestions, AiComposer)
│   ├── transactions/             (TransactionSheet, TransactionGroups, TransactionRow, TransactionSummary)
│   ├── import/                    (ImportSheet, Dropzone, ImportPreview, ImportOptions)
│   └── cmdk/                     (CommandPalette)
├── views/
│   ├── auth/                     (AuthScreen, WhatsAppOtpFlow, PhoneStep, OtpStep, EmailLoginForm)
│   ├── dashboard/                (DashboardScreen, MobileDashboard, DesktopDashboard, StatCard, BudgetMetersCard, RecentTransactions)
│   ├── transactions/            (TransactionsScreen, TransactionsHeader, DesktopSideCol, LimitUsageCard, TopCategoriesCard)
│   ├── budgets/                  (BudgetsScreen, BudgetOverviewCard, CategoryCardGrid, CategoryCard)
│   ├── reports/                  (ReportsScreen, MobileReports, DesktopReports, KpiCard, AiInsightsCard, CategoryPerformanceTable)
│   └── settings/                 (SettingsScreen, SettingsTabs, ProfileSettingsTab, PasswordSettingsTab, PrivacySettingsTab, DangerZoneCard)
├── context/                      (ThemeContext, AuthContext, UiContext, ToastContext, DataContext)
├── hooks/                        (useTransactions, useDashboard, useReports, useAlerts, useCopilot, useMediaQuery, useOtp, useDiscreetMode)
├── services/                     (ver §9)
├── utils/                        (format.js: moeda/data/percentual pt-BR · phone.js: máscara · debounce.js · money.js: parser)
└── __tests__/                    (colaterais por módulo: *.test.jsx)
```

## 7. Estratégia de CSS (2.6)

- **Tokens globais** em `styles/tokens.css`: variáveis do protótipo 1:1 (cores, alphas, raios, sombras, easing, `--cat-*`), temas via `:root[data-theme="dark|light"]`.
- **UI kit global** em `styles/base.css`: classes utilitárias do design system (`.ds-card`, `.ds-btn`… já existentes em `index.css`) para elementos de shell e tabelas.
- **CSS por componente**: cada componente pode ter `Componente.css` co-localizado com classes prefixadas (`.tx-row__value`) — sem styled-components, sem inline-style em JSX (hoje há muito inline-style a eliminar).
- **Tema**: alternância por `data-theme` no `<html>` (ThemeContext), leitura no boot (corrige bug do protótipo).
- **Breakpoints**: 880px principal (shell), 960px (Gastos 2 col), 1024/600 (KPIs), 480px (auth) — iguais ao protótipo.
- **Safe areas** e `interactive-widget=resizes-content` mantidos no base.css.
- Mobile-only/desktop-only padronizado em `useMediaQuery` (evita CSS duplicado).

## 8. Avaliação do `frontend/src/` atual (2.7)

| Item atual | Decisão | Justificativa |
|---|---|---|
| `styles` via `index.css` (tokens + UI kit) | **Aproveitar** | já espelha o design system do protótipo; dividir em tokens/base |
| `vite.config.js` + VitePWA (manifest, SW, icons, dev SW) | **Aproveitar** | paridade PWA pronta; mover `vite-plugin-pwa` para devDependencies |
| `components/layout/` (Sidebar, Topbar, BottomNav, PwaInstallBanner) | **Aproveitar c/ ajuste** | realinhar nomes/destinos ao protótipo (BottomNav: Início·Gastos·FAB·Categorias·Relatórios); Topbar ganha busca/cmdk, sino, importar |
| `components/modals/TransactionModal.jsx` | **Aproveitar c/ refação** | virar `TransactionSheet` (bottom sheet, toggle despesa/entrada com categorias distintas, parser pt-BR) |
| `context/FinanceContext.jsx` (mocks + localStorage) | **Descartar** | substituído por Auth/Theme/Ui/Toast/Data contexts + services reais |
| `views/DashboardView.jsx` | **Refazer** | protótipo define KPIs/badges/gráfico semana/medidores distintos |
| `views/TransactionsView.jsx` | **Refazer** | faltam agrupamento por data, chips de categoria, navegação de mês real, coluna lateral |
| `views/BudgetsView.jsx` | **Refazer** | realinhar a `page-categorias` (consolidado calculado + grade) |
| `views/CopilotView.jsx` (página) | **Descartar como página** | IA volta a ser overlay global (AiPanel) com function calling do backend |
| `views/SettingsView.jsx` | **Refazer** | 3 sub-abas do protótipo + zona de perigo + perfil via API |
| `App.css`, `assets/react.svg`, `assets/vite.svg`, `assets/hero.png` | **Remover** | lixo de template Vite |
| `main.jsx` / `App.jsx` | **Refazer** | providers + Router |
| Navegação por `activeTab` | **Descartar** | trocar por React Router (§2) |
| `legacy/frontend-pim3/` | **Referência apenas** | tem `services/api.js`, react-router e recharts como exemplo |

## 9. Camada de serviços (2.8) — `src/services/`

Cliente único `api.js` (fetch com baseUrl `VITE_API_URL` (default `/api/v1`), injeção do Bearer token, parse de erro padronizado do doc 04). Módulos e funções esperadas:

| Módulo | Funções (contrato no doc 04) |
|---|---|
| `api.js` | `request()` interna, `get/post/put/del`, tratamento 401 → logout |
| `authService` | `login(email, senha)`, `register(dados)`, `requestOtp(telefone)`, `verifyOtp(telefone, codigo)`, `demoLogin()`, `refresh(token)` (P2), `me()` |
| `userService` | `updateProfile`, `uploadAvatar`, `changePassword`, `getPreferences`, `updatePreferences`, `resetFinancialData`, `deleteAccount` |
| `categoryService` | `list(month, year)`, `create`, `update`, `remove` |
| `budgetService` | `upsert(categoryId, limitValue, month, year)`, `remove(categoryId, month, year)` |
| `transactionService` | `list({month, year, categoryId, type, search, page, pageSize, sortBy, order})`, `get(id)`, `create`, `update`, `remove` |
| `dashboardService` | `overview(period)`, `weeklyExpenses`, `recentTransactions(limit)`, `budgetMeters` |
| `reportService` | `summary(period)`, `byCategory(period)`, `trend(months)`, `daily(period)`, `exportCsv(period)`, `exportJson(period)` |
| `alertService` | `list({unreadOnly})`, `unreadCount()`, `markRead(id)`, `dismiss(id)` |
| `insightService` | `list()` |
| `copilotService` | `history()`, `sendMessage(content)`, `clearHistory()` |
| `importService` | `upload(file)` → preview, `confirm(items, {autoCategorize, ignoreDuplicates})` |
| `mocks/` | adaptadores com MESMAS assinaturas (dados do protótipo) para desenvolvimento antes do backend (ver doc 06 §4) |

Cada serviço retorna objetos tipados no formato do contrato (doc 04); componentes NÃO chamam `fetch` diretamente.

## 10. Dependências a adicionar (2.9)

| Dependência | Uso | Tipo |
|---|---|---|
| `react-router-dom` | rotas + guards | prod |
| `recharts` | gráficos (barra, linha/área, donut) | prod |
| `vitest` + `@testing-library/react` + `@testing-library/jest-dom` + `jsdom` | testes unitários/de componente | dev |
| `@vitest/coverage-v8` | cobertura (regra tests.md) | dev |
| `jspdf` (P2, opcional) | exportação PDF no cliente | prod |
| `@tanstack/react-query` (P2, opcional) | cache/revalidação de dados de servidor | prod |
| mover `vite-plugin-pwa` | hoje em `dependencies` | dev |
| scripts `test`/`test:run`/`test:coverage` | package.json (regra tests.md exige `npm test`) | — |

## 11. Mapa inventário → componente (critério de aceite 2)

Todo item de interface do inventário (doc 01 §2/§3/§9) tem destino:

| Item do inventário | Componente/tela |
|---|---|
| Login WhatsApp/e-mail/demo | `AuthScreen` (+ fluxos) |
| Sidebar/topbar/bottom-nav/FAB IA | `AppLayout` |
| KPIs e badges do dashboard | `StatCard` × `DashboardScreen` |
| Gráfico semana / medidores / 6M / donuts / barras duplas | `charts/` (§4) |
| Tabela de lançamentos recentes | `RecentTransactions(Table)` |
| Lista de gastos agrupada + filtros + vazio | `TransactionsScreen` |
| Coluna lateral de gastos | `LimitUsageCard` + `TopCategoriesCard` + `QuickActionsCard` |
| Consolidado e grade de categorias | `BudgetsScreen` |
| Relatórios mobile/desktop + KPIs + tabela | `ReportsScreen` |
| Configurações (3 abas + zona de perigo) | `SettingsScreen` |
| Sheet transação / importação / cmdk / notificações / IA | overlays (§3) |
| Toasts, tema, modo discreto, PWA | contexts + comuns |
| Estados de loading/erro (novos) | `Skeleton` + `ErrorState` |
