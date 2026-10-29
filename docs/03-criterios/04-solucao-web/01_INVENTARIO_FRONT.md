# 01 — Inventário do Protótipo (`frontend/index.html`)

> **Etapa 1 do `TASKS_MIGRACAO_FRONT_BACK.md`.** Documento de análise — nenhum código é alterado nesta fase.
> **Fonte da verdade:** protótipo em `frontend/index.html` (arquivo único, 8.523 linhas: CSS inline 1–4598, sprite SVG 4605–4759, HTML 4761–6921, JS inline 6923–8496, script PWA 8497–8520).
> **Papel do protótipo:** é a **especificação funcional** da migração (React no front + redesign do back).

---

## 1. Como o protótipo funciona (arquitetura atual)

- SPA **sem rota/hash**: navegação por exibição/ocultação de `<section class="page" id="page-{nome}">` controlada por `goPage(name)`.
- Overlays (modais/popovers) controlados pelo dicionário JS `overlays`: `expense` → `#sheetExpense`, `import` → `#sheetImport`, `cmdk` → `#cmdk`, `notif` → `#notifPop`, `ai` → `#aiPanel`.
- Gatilhos declarativos no DOM (regras de associação que o React deve substituir por props/callbacks):

| Marcador | Uso |
|---|---|
| `data-go="{pagina}"` | Navegação (dashboard, gastos, categorias, relatorios, configuracoes) |
| `data-open="{overlay}"` / `data-close` | Abre/fecha overlays |
| `data-theme-set="light\|dark"` | Troca de tema |
| `data-cfg-tab="{aba}"` | Sub-abas de Configurações |
| `data-f="{filtro}"` | Chips de categoria na tela Gastos |
| `data-prompt="{texto}"` | Sugestões do chat de IA |
| `data-cat-id` / `data-cat-name` | Pills de categoria no sheet de transação |
| `data-idx` | Caixas OTP (0–5) |
| `data-date-group` | Grupos de data em Gastos |

- Telas declaradas: `page-dashboard`, `page-gastos`, `page-categorias`, `page-relatorios`, `page-configuracoes` + `#viewAuth` (overlay de login) + 5 overlays.

---

## 2. Tabela-resumo — tela → dados → ações → precisa de backend?

| Tela / Seção | Dados exibidos | Ações do usuário | Estados | Backend? |
|---|---|---|---|---|
| **Login/`#viewAuth` (WhatsApp OTP)** | Telefone mascarado, timer de reenvio (45 s), código demo | Enviar código, preencher/colar OTP, reenviar, trocar número, autenticar | "Enviando código..." (500 ms), erros via `alert` | **Sim** (OTP, sessão) |
| **Login e-mail** | Campos e-mail/senha | Entrar, "esqueceu?" (simulado) | — | **Sim** |
| **Acesso demo 1 clique** | Botão | Entrar sem credenciais | — | **Sim** (conta demo) |
| **Shell: sidebar/topbar** | Título/subtítulo da página (`pageMeta`), avatar, sino com dot | Navegar, buscar (cmdk), notificações, importar, novo lançamento, popover usuário (config/logout), pill de tema | — | Parcial (popover/perfil) |
| **Dashboard (mobile e desktop)** | Saldo, entradas, saídas, badges de variação, % do teto, gráfico semana, medidores de orçamento, últimas transações (5), card IA | Novo lançamento, hover no gráfico, "ver tudo", chips do card IA ("Ver detalhes" → IA; "Criar limite" → Categorias) | Sem vazio/loading/erro | **Sim** (agregados) |
| **Gastos** | Transações agrupadas por data (Hoje/Ontem/dd MMM) com soma por grupo, subtítulo com categoria+pagamento, resumo filtrado (soma, contagem), mês, consumo do limite (34%), maiores categorias | Filtrar por categoria (chips), buscar texto, navegar mês, clicar transação (toast), novo lançamento, importar, ir a relatórios | **Vazio implementado** (`#empty`); sem loading/erro | **Sim** |
| **Categorias & Orçamentos** | Consolidado (total gasto/limite, % global, restante), grade de cards por categoria (gasto/limite, %, disponível/excesso, badge status) | "Nova categoria" (abre sheet de transação — **ambiguidade**), clicar card (intenção de filtro), "Definir teto" (visual) | Categoria sem limite → "Nenhum teto configurado" | **Sim** |
| **Relatórios (mobile e desktop)** | KPIs (média mensal, economia acumulada, economia via IA), barras entradas/saídas 6 meses, donut composição, comparativo mês anterior, gráfico 6M 3 séries, insights IA, tabela 6 categorias com tendência | Alternar período (visual), exportar PDF, exportar CSV, hover no gráfico | Sem vazio/loading/erro | **Sim** |
| **Configurações (geral/senha/privacidade)** | Perfil (foto, nome, e-mail verificado, telefone, CPF oculto, ocupação), parâmetros (teto geral R$ 8.380, moeda BRL, ciclo dia 01), senha com medidor de força, modo discreto, import/export, zona de perigo | Salvar perfil, atualizar metas, atualizar senha, alternar modo discreto, importar/exportar CSV/JSON, resetar registros, excluir conta | Formulários decorativos (sem persistência) | **Sim** |
| **Sheet de transação `#sheetExpense`** | Tipo despesa/entrada, categorias distintas por tipo, data | Criar transação (valida descrição + valor > 0), alternar tipo | Erros via `alert` | **Sim** |
| **Sheet de importação `#sheetImport`** | Dropzone (OFX/CSV/XLSX/PDF), preview (arquivo, 3 lançamentos, categoria sugerida por IA), toggles (auto-categoria, ignorar duplicidades) | Selecionar/arrastrar arquivo, confirmar importação (mock) | `.dragover` no dropzone | **Sim** |
| **Command palette `#cmdk`** | 9 comandos (navegação, importar, novo gasto, IA, alertas), filtro | Abrir com `/`, filtrar, executar | "Nenhuma ação encontrada" | Não (P1 estático) |
| **Popover de alertas `#notifPop`** | 3 alertas de orçamento (87%, 74%, estourado R$ 60), badge "3 ativos" | Abrir/fechar, dispensar (sem handler) | — | **Sim** |
| **Copilot IA `#aiPanel` + FAB** | Conversa semeada, 3 sugestões, input | Enviar mensagem (4 intents), arrastar FAB, alternar painel | Delay simulado 350 ms, auto-scroll | **Sim** |
| **Toasts** | Mensagens de sucesso | — | Duração 3,5 s | Não |
| **Tema claro/escuro** | Tokens completos | Alternar via pills/sidebar | — | Não (localStorage) |
| **PWA** | Manifest, SW, ícones, safe areas, anti-zoom iOS | Instalar app | — | Não |

---

## 3. Detalhamento por tela

### 3.1 Autenticação (`#viewAuth`)
- **Fluxo WhatsApp (2 etapas):** etapa 1 — telefone com máscara `(XX) XXXXX-XXXX` (valida ≥ 14 chars formatados, máx. 11 dígitos, prefixo +55); etapa 2 — OTP de 6 dígitos em caixas separadas (`#otpContainer`), botão demo preenche `849201`, auto-submit na 6ª caixa (delay 200 ms), suporte a colar, timer de reenvio 45 s (`Aguarde 0:SS` → link "Reenviar agora"), botão "Alterar" volta à etapa 1.
- **Fluxo e-mail:** aceita qualquer e-mail/senha (só valida não-vazio); "esqueceu?" = `alert`. Nome do usuário derivado do e-mail.
- **Acesso rápido demo:** 1 clique autentica.
- **Sessão:** `localStorage['conekta_auth']='true'`; `checkAuth()` no boot; logout remove e volta ao login (com `confirm`).
- **Lacunas do protótipo:** qualquer 6 dígitos autenticam; código OTP exibido na tela; sem verificação real.

### 3.2 Shell do app
- **Sidebar (desktop ≥ 880px):** marca, nav (Dashboard, Gastos, Categorias, Relatórios), CTA "Novo lançamento", footer com usuário (`#userTrigger` → popover com Configurações e Sair) e pill de tema.
- **Topbar (sticky, blur):** título/subtítulo dinâmicos (`pageMeta`), busca com hint `/` (abre cmdk), sino com dot (`#notifPop`), botão "Importar" e "Novo lançamento" (desktop), avatar mobile.
- **Bottom nav (mobile < 880px):** Início, Gastos, **FAB central "+"** (abre sheet de transação), Categorias, Relatórios.
- **FAB de IA (`#aiFab`):** arrastável (pointer events, detecção de drag > 8px, inércia `vx*150`), snap nos 4 cantos, wiggle e expansão do rótulo "Assistente de IA" (3,2 s) no mobile.

### 3.3 Dashboard (`#page-dashboard`)
- **KPIs:** Saldo `R$ 4.286,50` (badge `+14.2% mês`, "Atualizado agora"), Entradas `R$ 7.850,00` (+8.4%), Saídas `R$ 3.563,00` ("68% do teto", "Limite de R$ 6.350,00"). Mobile: mesmo saldo + delta "R$ 640 a mais que em setembro".
- **Cálculo dinâmico (JS `updateDashboardKpis()`):** `currentBalance` (base 4.286,50) ajustado por lançamentos; despesa subtrai e soma em `currentExpenses`; **entradas = 7850 + max(0, saldo − 4286,50)** — fórmula híbrida a **substituir** por cálculo real no backend.
- **Gráfico semana (mobile e desktop):** barras SEG–DOM (45/30/65/40/90/75/32%), total `R$ 994,00`, média diária `R$ 142,00`; toggle Semana/Mês (visual).
- **Orçamento por categoria (desktop):** medidores Moradia 90%, Alimentação 65%, Transporte 63%, Lazer 36% (valores estáticos divergentes de Categorias — ver §10).
- **Card IA (mobile):** "32% a mais com alimentação…" com chips "Ver detalhes" (abre IA) e "Criar limite" (vai a Categorias).
- **Lançamentos recentes:** tabela (desktop) / lista (mobile) com 5 transações (`txs`), ícone por categoria, data relativa.
- **Estados:** nenhum vazio/loading/erro (lista sempre mockada).

### 3.4 Gastos (`#page-gastos`)
- **Lista:** 10 transações mock (`gastosTxs`) agrupadas por `dateGroup` ("Hoje", "Ontem", "17 out"...) com soma por grupo; cada linha: ícone, título, subtítulo (ex.: "Alimentação · Cartão", "Transporte · Pix", "Moradia · Boleto · Recorrente"), valor "− R$ 186,40".
- **Filtros combinados:** categoria (chips `data-f`: all/alim/mor/trans/lazer/saude/outros) + busca texto case-insensitive (`#q`); resumo `#sum-val` (soma dos visíveis) e `#sum-count`.
- **Navegação de mês:** `#btnGastosPrevMonth/NextMonth` cicla `monthsList` — **só muda o rótulo, não filtra dados** (lacuna a corrigir).
- **Coluna lateral (desktop):** "Consumo do Limite" (R$ 2.168,90 / meta R$ 6.350 = 34%, média R$ 144/dia), "Maiores Categorias" (4 medidores), atalhos (novo lançamento, importar, relatórios).
- **Estados:** vazio implementado (`#empty`: "Nenhuma transação encontrada"); grupos sem itens são ocultados.
- **Lacuna:** clicar numa transação só mostra toast — **sem detalhe/edição/exclusão** no protótipo (o React atual de PIM III já tem delete; ver 02_PLANO_COMPONENTES).

### 3.5 Categorias (`#page-categorias`)
- **Consolidado calculado em JS** a partir do array `categories`: total gasto, total limite, % global (26%), restante, badge global (>100% "Teto estourado" / ≥80% "Atenção" / senão "Sob controle").
- **Grade por categoria** (6): ícone, badge de status, nome, descrição, "R$ gasto / R$ limite", % colorido, mini-barra, "Disponível: R$ X" ou "Excesso de R$ X", link "ver extrato →".
- **Lacunas:** botão "Nova categoria" abre o sheet de **transação**; clique no card anuncia filtro mas não aplica; "Definir teto" sem handler.

### 3.6 Relatórios (`#page-relatorios`)
- **Mobile:** seletor de período (Mês/6 meses/Ano — visual), KPI "Sobra média por mês" R$ 3.447 (+8%), barras duplas entradas/saídas (mai–out), donut "Para onde foi o dinheiro" (5 fatias, centro "R$ 3,5 mil em out"), comparativo com setembro (Alimentação +32% ruim, Transporte −14% ok, Lazer −22% ok), insight IA, botão "Exportar relatório em PDF".
- **Desktop:** selects de período, "Exportar PDF" e "Exportar CSV" (alert); 3 KPIs (Média Mensal de Gastos R$ 4.270,00 / −6.2%; Economia Acumulada R$ 10.480,00 / "Meta 104%"; Economia via IA Conekta R$ 1.140,00 / "8 Otimizações"); gráfico SVG 6M com 3 séries (Receitas/Despesas/Guardado) e tooltip por mês; donut "Composição dos Gastos" (42/23/9/11/15%); card "Diagnóstico & Insights da IA" (4 itens estáticos); tabela "Desempenho Detalhado por Categoria (Balanço 6M)" com mini-barra e badge de tendência por linha.

### 3.7 Configurações (`#page-configuracoes`) — sub-abas `data-cfg-tab`
- **Geral:** foto de perfil (alterar/remover, JPG/PNG/WebP, máx. 2MB); dados pessoais (nome completo, nome de exibição, e-mail com badge "Verificado", telefone/WhatsApp, CPF oculto readonly, ocupação); parâmetros orçamentários (teto geral mensal R$ 8.380,00, moeda BRL readonly, início do ciclo dia 01).
- **Senha:** atual, nova (mín. 8) com medidor de força (4 steps — estático), confirmar.
- **Privacidade & Dados:** **Modo Discreto** (switch — oculta cifras/saldos; sem implementação no JS); importar extrato/planilha; "Exportar CSV"/"Exportar JSON" (sem handler); **zona de perigo**: "Redefinir registros financeiros" (remove despesas, mantém categorias) e "Excluir conta permanentemente" (ambos sem handler).

### 3.8 Overlays
- **`#sheetExpense`:** tipo despesa/entrada (recoloriza para verde, troca labels, prefixo "− R$"→"+ R$", categorias `expenseCategories` × `incomeCategories`); campos descrição, valor (parser pt-BR: remove "R$", pontos de milhar, vírgula→ponto), data (default "17/09/2026"); submit adiciona em `txs`/`gastosTxs`, re-renderiza listas e KPIs, toast de sucesso. **Sem edição/exclusão.**
- **`#sheetImport`:** dropzone real (accept .ofx/.csv/.xlsx/.xls/.pdf, drag&drop com classe `.dragover`); preview mock (arquivo 42KB "Pronto", 3 lançamentos com categoria sugerida); switches "Categorização automática por IA" e "Ignorar duplicidades já registradas" (sem efeito); confirmar injeta 3 transações mock.
- **`#cmdk`:** 9 comandos fixos (5 navegações + importar + novo gasto + IA + alertas), filtro por substring, item vazio.
- **`#notifPop`:** 3 alertas estáticos (Moradia 87% "Atenção ao limite restante"; Alimentação 74% "Restam R$ 180,00"; Lazer "acima do limite", excedido R$ 60,00); botão dispensar sem handler.
- **`#aiPanel`:** conversa semeada, 3 sugestões (`data-prompt`), input + enviar, Enter envia; respostas após 350 ms; ver §5.5.

---

## 4. Dados mock e persistência

### 4.1 Estruturas JS (fonte de cada dado exibido)

| Variável | Campos | Conteúdo |
|---|---|---|
| `categories` | `{id, name, desc, icon, color, limit, spent}` | 6 categorias de despesa com teto (lazer **estourado** 310/250; educacao **sem teto** limit 0) |
| `expenseCategories` | `{id, name, color}` | 7: alimentacao, transporte, lazer, moradia, saude, educacao, outros |
| `incomeCategories` | `{id, name, color}` | 6: salario, investimentos, freelance, dividendos, reembolso, outras_entradas |
| `txs` | `{name, cat, catName, date, value, type}` | 5 lançamentos recentes (inclui Salário +5200 income) |
| `gastosTxs` | `{id, name, cat, catName, subtitle, dateGroup, date, value, type, color}` | 10 despesas de outubro/2026 (186.40…1450.00) |
| `catIcon` / `catColor` | mapas id→symbol/cor | 13 chaves (inclui categorias de receita) |
| `cmds` | `{name, hint, icon, action}` | 9 comandos da palette |
| `pageMeta` | página→[título, subtítulo] | metadados de header |
| Estado volátil | — | `currentTxType`, `selectedCategory`, `currentBalance=4286.50`, `currentExpenses=3563.00`, `currentGastosFilter`, `currentMonthIndex` |
| Mock do import | `{name, cat, catName, date, value}` | 3 lançamentos (Uber, Drogaria, Netflix) |

### 4.2 localStorage atual (chaves exatas)

| Chave | Escrita | Leitura | Conteúdo | Migração |
|---|---|---|---|---|
| `conekta_auth` | `completeLogin()` / logout | `checkAuth()` no boot | flag de sessão | → token JWT + refresh (backend) |
| `conekta_theme` | `setTheme()` | **nunca lida** (bug: tema não sobrevive a reload) | 'dark'/'light' | permanece local (front) |

**Nenhuma transação/categoria é persistida** — tudo é memória volátil. Na migração, **todos os dados abaixo passam a vir do servidor**: transações, categorias, tetos/orçamentos, perfil, alertas, insights, histórico de IA, importações.

---

## 5. Regras de negócio extraídas do JS (5.1–5.6 = itens 1.5 da task)

### 5.1 Saldos e totais
- Saldo = entradas − despesas do período; exibido com `toLocaleString('pt-BR', {minimumFractionDigits:2})`.
- Despesas acumulam em `currentExpenses`; % do teto mensal exibido no card de Saídas (68% de R$ 6.350).
- Resumo de Gastos: soma e contagem dos itens após filtro (categoria + texto).
- Categorias: `pct = round(spent/limit*100)`; consolidado `round(Σspent/Σlimit*100)`; restante `max(0, Σlimit−Σspent)`; barra global `min(pct,100)%`.

### 5.2 Limites e alertas (thresholds oficiais)
- Por categoria: **>100% → "Estourado"** (vermelho, "Excesso de R$ X"); **80–100% → "Em Atenção"** (âmbar); **<80% → "Sob controle"**; **limite 0 → "Sem teto"** com CTA "Definir teto".
- Consolidado: mesmos cortes (>100 "Teto estourado (N%)", ≥80 "Atenção (N%)", senão "Sob controle (N%)").
- Alertas do popover: exemplificam 87% (atenção), 74% (informativo) e >100% (estourado R$ 60) — **no backend, os gatilhos reais devem ser 80% e 100%**, com mensagem "Restam R$ X até o fechamento" / "Orçamento excedido em R$ X".
- Badge de KPI de saídas: "% do teto" do mês.

### 5.3 Filtros e agrupamentos
- Gastos: filtro combinado categoria+busca (substring, case-insensitive); agrupamento por data com soma por grupo, preservando ordem de inserção.
- Períodos dos relatórios: mês atual, 6 meses, ano (seletores visuais; no backend virarão parâmetros `start`/`end`).

### 5.4 Formatos
- Moeda pt-BR `R$ 1.234,56` (fonte mono, `tabular-nums`); valores negativos com prefixo "−".
- Datas relativas ("Hoje", "Ontem") ou "17 out"; parse de valor pt-BR (vírgula decimal).
- Percentuais inteiros ou 1 casa ("+14.2%").

### 5.5 Copilot IA (lógica atual — a substituir por function calling real)
- `sendAiMessage(text)` faz intent matching por substring:
  1. contém "registrar" + "gasto" → **abre o sheet de transação** (function calling simulado);
  2. contém "resumo" ou "gastos" → resposta fixa com entradas/saídas/saldo;
  3. contém "economizar" ou "cortar" → resposta fixa sobre Lazer 124% do orçamento;
  4. fallback → resposta genérica.
- **Contexto usado: nenhum** (strings fixas). Sugestões: "Resumo detalhado do mês", "Onde posso economizar?", "Registrar novo gasto".
- **Comportamentos a preservar:** respostas com números reais do usuário, ação de criar transação a partir do chat, sugestões que somem após o uso e voltam ao reabrir, auto-scroll, Enter envia, painel flutuante sobre qualquer tela.

### 5.6 Importação de extratos (conceitos a implementar)
- Formatos aceitos: OFX, CSV, XLSX, XLS, PDF.
- Preview com lançamentos detectados + **categoria sugerida por IA**.
- Opções: **categorização automática por IA** e **ignorar duplicidades já registradas** (conciliação/dedup).
- Confirmação importa N lançamentos e re-renderiza dashboards (toast de conciliação).

---

## 6. Funcionalidades NOVAS em relação ao backend atual (item 1.3)

O backend atual (PIM III) cobre: auth e-mail/senha, CRUD de despesas, CRUD de receitas (sem update), categorias **globais**, orçamentos só do mês corrente, 4 relatórios, alertas por POST de despesa, insights hardcoded, chat via webhook n8n. **Novidades exigidas pelo protótipo:**

| # | Funcionalidade nova | Status no backend atual | Prioridade sugerida (a validar em 7.2) |
|---|---|---|---|
| N1 | Login por WhatsApp com OTP (solicitação, verificação, reenvio, troca de número) | Inexistente | P1 (provedor simulado em dev) |
| N2 | Acesso demo com 1 clique | Inexistente (só seed manual) | P1 |
| N3 | Perfil do usuário (foto, nome de exibição, telefone, CPF, ocupação) | Inexistente (só nome/e-mail/tipo) | P1 |
| N4 | Preferências orçamentárias (teto geral mensal, moeda, dia do ciclo) | Inexistente | P1 |
| N5 | Alteração de senha logado | Inexistente | P1 |
| N6 | Categorias **por usuário** com CRUD completo (atual: globais, com risco cross-tenant) | Parcial/defeituoso | P1 |
| N7 | Orçamento por categoria/mês com upsert (atual: só mês corrente, sem delete) | Parcial | P1 |
| N8 | Transações unificadas (despesa **e** entrada no mesmo recurso, com edição/exclusão) | Parcial (recursos separados, income sem update) | P1 |
| N9 | Paginação, filtros (texto, categoria, tipo, mês) e ordenação em transações | Inexistente | P1 |
| N10 | Endpoints agregados do Dashboard (saldo, entradas, saídas, % teto, semana, recentes) | Inexistente (front teria que calcular) | P1 |
| N11 | Copilot IA com **function calling** (resumo, sugestão de economia, criar transação) e histórico | Parcial (chat webhook n8n, sem tools) | P1 |
| N12 | Importação de extratos (parse, preview, sugestão de categoria, dedup) | Inexistente | P2 |
| N13 | Exportação CSV/JSON/PDF de relatórios | Inexistente | P2 (PDF no front) |
| N14 | Zona de perigo: resetar registros / excluir conta | Inexistente | P2 |
| N15 | Modo discreto (ocultar cifras) | N/A — **front-only** | P1 (front) |
| N16 | Notificações/alertas com contador não lidas e dispensa | Parcial (sem dedup, sem contador) | P1 |
| N17 | Insights calculados (tendências, comparações, economia) | Parcial (hardcoded) | P2 |

## 7. Somente interface (sem backend) — item 1.6

- Tema claro/escuro (troca + persistência local; **corrigir leitura no boot**).
- Modo discreto (toggle local que mascara valores no front).
- PWA completo: manifest, service worker, ícones, banner de instalação, safe areas iOS, bloqueio de pinch-zoom, modo standalone.
- FAB de IA arrastável com física (drag, inércia, snap, wiggle).
- Command palette (P1 estático; P2 pode buscar registros).
- Toasts, animações (`pageFadeIn`, transições de sheets), hover states, focus-visible.
- Bottom nav / sidebar / topbar responsivos (breakpoint 880px).
- Ajuste de overlays ao teclado virtual (`visualViewport` + `interactive-widget`).
- Mascaramento de telefone, OTP boxes, medidor de força de senha (front).

## 8. CSS / Design System (item 1.7)

- **Tipografia:** Inter (300–800) + IBM Plex Mono (números, `tabular-nums`); via Google Fonts.
- **Raios:** `--ds-radius-sm 4px`, `md 6px`, `lg 8px`, `xl 12px`, `2xl 16px`, `full 9999px`.
- **Movimento:** `--ds-ease cubic-bezier(0.16,1,0.3,1)`, `--ds-duration-fast 120ms`, `normal 200ms`; animações relevantes: `pageFadeIn` (160 ms), `aiFabWiggle` (0.85 s), sheets (translateY 0.28 s), toasts (0.25 s), transição de barras (0.3 s) e dots (0.15 s).
- **Tema dark (padrão, `:root[data-theme="dark"]`):** fundos `#000/#0a0a0a/#121212`; escala `--ds-gray-100..1000` + alphas 100–500; paleta funcional blue/red/amber/green/teal/purple/pink com `*-alpha-200`; **tokens por categoria** `--cat-alimentacao`(red), `--cat-moradia`(amber), `--cat-transporte`(blue), `--cat-lazer`(green), `--cat-saude`(pink), `--cat-educacao`(purple), `--cat-outros`(gray); foreground `#ededed`, muted `#888`, faint `#555`; borders, sombras (small/medium/large), `--ds-focus-ring`, `--ds-grid-line`.
- **Tema light (`data-theme="light"`):** espelhos claros (#fff/#fafafa/#f5f5f5 etc.).
- **Breakpoints:** **880px** (principal: sidebar↔bottom-nav, sheets viram bottom-sheets, mobile-only/desktop-only), 601–880px (stat-grid 2 col), **960px** (Gastos 2 colunas), 1024px/600px (KPIs), 480px (auth-card).
- **Safe areas:** `env(safe-area-inset-*)` em body, topbar, view-container, bottom-nav, FAB, sheets, auth.
- **Diversos:** blur backdrop 12–16px, `.app-glow` radial, `.table-wrap` scroll horizontal, scrollbars ocultas, `interactive-widget=resizes-content`, `user-scalable=no`.

## 9. Gráficos (inventário — 13 visualizações)

| # | Gráfico | Local | Tipo | Dados |
|---|---|---|---|---|
| 1 | Gastos da semana (mobile) | Dashboard | Barras CSS 7 colunas | SEG–DOM %, total R$ 994, média R$ 142 |
| 2 | `#spendChart` | Dashboard desktop | Barras | Mesmos 7 valores + hover |
| 3 | Orçamento por categoria | Dashboard desktop | Medidores | Moradia 90%, Alimentação 65%, Transporte 63%, Lazer 36% |
| 4 | Categorias (linhas) | Dashboard mobile | Barras horizontais | Moradia 92%, Alimentação 98%, Transporte 52%, Lazer 34% |
| 5 | Consumo do limite | Gastos | Barra de progresso | R$ 2.168,90 / R$ 6.350 (34%) |
| 6 | Maiores categorias | Gastos | 4 medidores | Moradia 67%, Alimentação 12%, Transporte 4%, Lazer 3% |
| 7 | Consolidado | Categorias | Barra global | Σgasto/Σlimite (26%) |
| 8 | Mini-barras por categoria | Categorias | `.mini-bar` | % com cor de status |
| 9 | Entradas e saídas | Relatórios mobile | Barras duplas | mai–out (in/out) |
| 10 | Donut "Para onde foi o dinheiro" | Relatórios mobile | `conic-gradient` | 5 fatias + centro |
| 11 | Evolução 6M `#chart6mSvg` | Relatórios desktop | SVG multi-linha + área | Receitas/Despesas/Guardado por mês + tooltip |
| 12 | Donut "Composição dos Gastos" | Relatórios desktop | `conic-gradient` | 42/23/9/11/15% |
| 13 | Mini-barra + tendência | Tabela 6M | `.mini-bar` + `.trend-badge` | Por categoria |

**Biblioteca alvo no React:** Recharts (linha/área/donut/barra) + medidores em CSS puro (ver doc 02).

## 10. Lacunas e inconsistências do protótipo (a corrigir na migração)

1. **Dados divergentes entre telas** (cada bloco tem dataset próprio): saídas R$ 3.563 (dashboard) vs R$ 2.168,90 (gastos) vs R$ 830 (categorias); tetos R$ 6.350 / R$ 3.150 / R$ 8.380; Moradia 1800/2000, 1450/1600 e 400/1500 em telas diferentes → **uma única fonte de verdade no backend**.
2. Navegação de mês em Gastos e seletores de período mudam só o rótulo (sem filtro real).
3. Botão "Nova categoria" abre sheet de transação; clique em card de categoria não aplica o filtro anunciado.
4. `conekta_theme` é gravado mas nunca lido (tema não sobrevive a reload).
5. Código morto: `#tx-body-full` referenciado no JS mas ausente no DOM; `switchGastosTab` sem elementos; seletor `.chart-6m-group` (classe real `.chart-6m-group-g`); CSS `.spark` sem uso.
6. Sem estados de loading/skeleton/erro de rede; validações via `alert()` nativo; único estado vazio é o de Gastos.
7. Alertas do popover não são gerados pelos thresholds do código (87/74% hardcoded).
8. Sem edição/exclusão/detalhe de transação no protótipo.

## 11. Aceite da etapa

- [x] 1.1 Todas as telas e seções listadas (§2, §3)
- [x] 1.2 Dados, ações e estados por tela (§3, §2)
- [x] 1.3 Funcionalidades novas marcadas (§6)
- [x] 1.4 Dados que hoje vivem em JS/localStorage e precisam ir ao servidor (§4)
- [x] 1.5 Regras de negócio extraídas (§5)
- [x] 1.6 Itens apenas-interface separados (§7)
- [x] 1.7 CSS/design system mapeado (§8)

**Critério de aceite:** nenhuma funcionalidade do protótipo fora deste documento — coberto por §2 (resumo), §3 (detalhe), §9 (gráficos) e §10 (lacunas).
