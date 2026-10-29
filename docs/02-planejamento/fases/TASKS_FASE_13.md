# 🚀 Tasks da Fase F13 — Refinamento de UX, Autenticação e Onboarding

> **Projeto:** ConektaFinance — PIM IV (UNIP)  
> **Status:** Planejada / Pendente `[ ]`  
> **Área:** Frontend (React 19 + Vite + PWA) & Backend (ASP.NET Core 10 Web API)  
> **Padrão de Commits:** Rigorosamente alinhado a `.agents/rules/git.md` (`tipo(escopo): descrição`)  
> **Critério de Testes:** 100% de aprovação pré-commit (`npm test`, `npm run build`, `dotnet test`) conforme `.agents/rules/tests.md`

---

## 📊 Tabela Consolidada de Tasks

| Status | ID | Área | Tarefa | Critério de Aceite (DoD) | Commit Previsto |
|:---:|---|---|---|---|---|
| [ ] | **F13.1** | `frontend` | Redesenhar tela de login com estética clean/moderna e autenticação exclusiva via WhatsApp (OTP) com sessão salva | Redesign visual minimalista (card arejado, cantos arredondados, microinterações e contraste suave); remoção total da aba e-mail/senha; fluxo único de telefone WhatsApp com OTP de 6 dígitos; checkbox "Lembrar de mim / Salvar sessão" gerenciando persistência (`localStorage` vs `sessionStorage`); botão de demonstração secundário em estilo sutil. | `feat(frontend): redesenha tela de login com layout clean e auth exclusiva por whatsapp` |
| [ ] | **F13.2** | `frontend` / `backend` | Implementar fluxo guiado de Onboarding para novos usuários | Tela/modal pós-autenticação exibido no primeiro acesso: coleta de nome completo, teto de gastos mensal inicial e confirmação de preferências; persistência dos dados no backend e redirecionamento suave ao Dashboard. | `feat(frontend): implementa fluxo guiado de onboarding para novos usuarios` |
| [ ] | **F13.3** | `frontend` | Destacar o dia atual em azul no gráfico "Distribuição de gastos na semana" | Identificar dinamicamente o dia corrente da semana nos dados do gráfico e aplicar preenchimento azul (`var(--ds-blue-600)` / `#2563EB`) na barra do dia de hoje, mantendo os demais dias em tons neutros. | `style(frontend): destaca dia atual em azul no grafico de gastos semanais` |
| [ ] | **F13.4** | `frontend` | Integrar teto do Onboarding ao card "Consumo do Limite" no Dashboard | O card de "Consumo do Limite" no Dashboard passa a utilizar o teto global configurado pelo usuário no Onboarding, calculando o percentual de consumo em tempo real e indicando alertas visuais de proximidade da meta. | `feat(frontend): conecta teto orcamentario do onboarding ao card de consumo` |
| [ ] | **F13.5** | `frontend` | Corrigir totalizador da tela "Gastos" para somar exclusivamente despesas | O indicador consolidado "Transações por período" deve filtrar apenas transações do tipo `Despesa` (`expense`), excluindo receitas da somatória e exibindo rótulo explícito. | `fix(frontend): ajusta totalizador de gastos para somar exclusivamente despesas` |
| [ ] | **F13.6** | `frontend` | Tornar o gráfico de "Entradas e Saídas" mais descritivo e intuitivo | Adicionar legenda visual explícita com cores semânticas (Verde = Entradas, Vermelho = Saídas), custom tooltip com valor de entradas, saídas e saldo líquido do mês formatado em R$ (BRL). | `style(frontend): enriquece informacoes e tooltips do grafico de entradas e saidas` |

---

## 🔍 Detalhamento das Tarefas

### Task F13.1 — Redesign Clean/Moderno da Tela de Login e Auth WhatsApp OTP

#### 1. Contexto e Motivação
A tela de autenticação é a porta de entrada da plataforma. Para modernizar a experiência de uso (alinhada aos objetivos do PIM IV), senhas convencionais são substituídas pelo fluxo fluido de autenticação sem senha via WhatsApp (OTP). O design deve seguir princípios de clareza visual, leveza e minimalismo.

#### 2. Diretrizes de Design & UX
* **Visual Minimalista:**
  - Card central flutuante com cantos arredondados generosos (`border-radius: 16px` a `20px`), bordas ultrafinas translúcidas e sombra difusa (*ambient drop-shadow*).
  - Espaçamentos equilibrados e respiro visual (*whitespace* generoso), sem poluição de caixas e molduras pesadas.
* **Tipografia e Hierarquia:**
  - Logo/marca moderna do ConektaFinance no topo, título conciso (*"Acesse sua conta"*) e subtítulo em tom neutro suave.
* **Componentes de Entrada:**
  - Input de telefone WhatsApp com prefixo de país integrado (🇧🇷 +55), máscara automática formatada `(XX) XXXXX-XXXX` e anel de foco suave (`focus-visible: ring`).
  - Caixas de código OTP (6 dígitos) com animação suave, foco automático sequencial e suporte a colar código (*paste*).
  - Checkbox customizado e elegante para *"Lembrar de mim neste dispositivo"*.
* **Ações:**
  - Botão primário com visual sólido e moderno, transição suave de estado (*hover/active*) e spinner de carregamento integrado.
  - Acesso de demonstração (*Demo*) posicionado como link discreto ou botão secundário fantasma (*ghost*).

#### 3. Critérios de Aceite (DoD)
- [ ] Eliminação completa de campos e abas de e-mail e senha.
- [ ] Transição fluida entre etapa 1 (inserção do telefone) e etapa 2 (código OTP de 6 dígitos).
- [ ] Checkbox de salvar sessão funcional: persiste sessão no `localStorage` quando marcado; usa `sessionStorage` quando desmarcado.
- [ ] Totalmente responsivo e adaptado para PWA/Mobile-first (sem rolagem desnecessária no teclado virtual).
- [ ] Suporte consistente aos temas Claro e Escuro com conformidade de contraste WCAG AA.

---

### Task F13.2 — Fluxo Guiado de Onboarding Inicial

#### 1. Contexto e Motivação
Usuários recém-cadastrados precisam de uma ambientação acolhedora para configurar seus dados essenciais antes de utilizarem os gráficos e relatórios financeiros.

#### 2. Escopo Funcional
* **Gatilho de Ativação:**
  - Ao concluir a autenticação, o frontend verifica se o usuário possui perfil inicial configurado (ex.: nome preenchido e teto mensal definido). Caso não possua, abre o fluxo guiado de Onboarding.
* **Etapas do Onboarding:**
  1. **Passo 1 — Identificação:** Campo para Nome Completo / Nome de preferência.
  2. **Passo 2 — Meta Financeira:** Definição do Limite Mensal Global de Gastos (R$), com sugestões rápidas (ex.: R$ 2.000, R$ 3.500, R$ 5.000 ou personalizado).
  3. **Passo 3 — Boas-vindas:** Breve resumo das categorias criadas automaticamente e botão *"Ir para o Dashboard"*.
* **Persistência:** Atualização das informações no endpoint correspondente de perfil do backend (`/api/v1/users/profile` ou `/api/v1/users/me`).

#### 3. Critérios de Aceite (DoD)
- [ ] Primeiro acesso direciona o usuário diretamente para o fluxo de onboarding.
- [ ] Validações amigáveis de formulário com máscaras monetárias adequadas (R$).
- [ ] Persistência bem-sucedida dos dados no banco via API.
- [ ] Usuários com cadastro já completo não são interceptados pelo onboarding.

---

### Task F13.3 — Destaque do Dia Atual no Gráfico Semanal de Gastos

#### 1. Contexto e Motivação
Na tela de visão geral, o gráfico de barras que exibe a "Distribuição de gastos na semana" deve oferecer leitura instantânea de onde o usuário se encontra no ciclo semanal.

#### 2. Escopo Técnico
* **Identificação da Data:**
  - Mapear a data atual do sistema (`new Date()`) e determinar o índice ou identificador do dia da semana (Domingo a Sábado / Seg a Dom).
* **Renderização Dinâmica:**
  - No componente Recharts (`<BarChart>` com `<Cell />`), aplicar a cor de preenchimento (`fill`):
    - Dia corrente: `var(--ds-blue-600)` ou `#2563EB`.
    - Outros dias: tom neutro suave do tema (`var(--ds-surface-secondary)` ou cinza balanceado).
* **Tooltip:**
  - Exibir indicação textual clara *"Hoje"* no cabeçalho ou tooltip ao inspecionar a barra do dia corrente.

#### 3. Critérios de Aceite (DoD)
- [ ] A barra correspondente ao dia de hoje é renderizada em azul destacado.
- [ ] As demais barras da semana permanecem neutras, garantindo contraste e hierarquia visual.
- [ ] Mudança de dia reflete automaticamente sem necessidade de reload manual.

---

### Task F13.4 — Integração do Teto do Onboarding ao Card "Consumo do Limite"

#### 1. Contexto e Motivação
O card de "Consumo do Limite" no Dashboard deve refletir a meta real estipulada pelo usuário no onboarding, proporcionando senso de controle orçamentário transparente.

#### 2. Escopo Técnico
* **Origem dos Dados:**
  - Ler o valor do teto mensal cadastrado no perfil do usuário (`monthlySpendingLimit` ou similar).
* **Cálculo da Métrica:**
  - `porcentagem_consumida = (total_despesas_mes_atual / teto_definido) * 100`.
* **Indicadores Visuais:**
  - Barra de progresso com transição suave e cores semânticas:
    - `< 80%`: Verde / Azul (Saudável).
    - `80% a 99%`: Amarelo (Atenção).
    - `>= 100%`: Vermelho (Limite Atingido).
  - Atalho discreto de edição rápida (ícone de lápis/configuração) para alterar a meta sem sair do Dashboard.

#### 3. Critérios de Aceite (DoD)
- [ ] O valor do limite máximo no card corresponde ao valor setado no onboarding.
- [ ] O percentual e o valor restante/excedente são calculados com precisão.
- [ ] O card reage instantaneamente à inclusão ou edição de despesas do mês corrente.

---

### Task F13.5 — Filtro Exclusivo de Despesas no Totalizador de Gastos

#### 1. Contexto e Motivação
Na tela de "Gastos" (`/transacoes`), o cartão consolidador de valores atualmente agrega tanto despesas quanto receitas, gerando ambiguidade na análise de despesas puras.

#### 2. Escopo Técnico
* **Ajuste de Cálculo:**
  - No componente de cabeçalho da listagem de transações, alterar a agregação de soma:
    ```javascript
    const totalGastosPeriodo = transacoes
      .filter(t => t.type === 'expense' || t.tipo === 'Despesa')
      .reduce((acc, t) => acc + Number(t.amount || t.valor || 0), 0)
    ```
* **Rotulagem:**
  - Ajustar o título do card para *"Total de Gastos no Período"* ou *"Despesas do Período"*.

#### 3. Critérios de Aceite (DoD)
- [ ] O card exibe estritamente o valor de despesas ocorridas no período filtrado.
- [ ] Nenhuma entrada/receita é adicionada à somatória deste indicador na tela de Gastos.
- [ ] O valor bate exatamente com a soma dos itens de saída listados na tabela.

---

### Task F13.6 — Gráfico de Entradas e Saídas Mais Descritivo

#### 1. Contexto e Motivação
O gráfico comparativo de Entradas vs Saídas precisa comunicar com clareza o resultado financeiro mensal (sobra ou déficit), auxiliando o usuário a compreender seu fluxo de caixa em poucos segundos.

#### 2. Escopo Técnico
* **Legenda e Identificação:**
  - Legenda superior explícita com marcadores coloridos: 🟢 **Entradas** e 🔴 **Saídas**.
* **Tooltip Enriquecida (`CustomTooltip`):**
  - Valor detalhado de receitas: `R$ X.XXX,XX`.
  - Valor detalhado de despesas: `R$ X.XXX,XX`.
  - Linha divisória e indicador de **Saldo Líquido do Mês**:
    - `Saldo: + R$ X.XXX,XX` (em verde) quando superavitário.
    - `Saldo: - R$ X.XXX,XX` (em vermelho) quando deficitário.
* **Eixos e Escalas:**
  - Formatação dos valores dos eixos Y no padrão BRL abreviado (ex.: `R$ 1k`, `R$ 5k`).

#### 3. Critérios de Aceite (DoD)
- [ ] Gráfico possui legenda visual e semântica clara.
- [ ] Tooltip customizada exibe entradas, saídas e o saldo líquido calculado para o período inspecionado.
- [ ] Visual alinhado ao design system, responsivo e de fácil interpretação em dispositivos móveis.

---

## 🛠️ Instruções de Execução e Qualidade

1. **Testes Obrigatórios:**
   - Todo componente ajustado ou criado deve ter cobertura de teste unitário/integração via Vitest (`npm test` no `frontend/`).
   - Validação contínua com `npm run build` garantindo ausência de erros de compilação ou linter.
2. **Git & Versionamento:**
   - Cada tarefa deve gerar um commit isolado seguindo a convenção estrita de `git.md`:
     - Mensagem em português, tempo presente/infinitivo, sem ponto final, minúscula no início.

