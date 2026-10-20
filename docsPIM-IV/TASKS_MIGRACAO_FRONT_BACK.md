# Tasks de Planejamento — Migração do Front para React e Refação do Backend

> **Escopo deste documento:** somente etapas de **análise, levantamento e documentação**.
> **Nenhuma etapa altera ou implementa código** (front, back, banco ou infra). Todos os entregáveis são arquivos `.md`/`.yaml` em `docsPIM-IV/`.
> A implementação será planejada e executada em um documento de tasks separado, após a aprovação desta fase.

**Contexto:** o front atual (`frontend/index.html`) é um protótipo em HTML + JS inline, com dados mock, e contém funcionalidades novas que o backend atual não cobre. Logo, **o front é a especificação** e o backend será redesenhado a partir dele.

**Direção técnica a validar:** React + Vite (SPA/PWA) no front · ASP.NET Core (.NET 10) no back · Nginx + Docker.
**Next.js:** descartado por ser app atrás de login, sem necessidade de SEO/SSR, com PWA e proxy Nginx `/api` já existentes.

**Legenda:** `[ ]` pendente · `[x]` concluído

> **Status (20/10/2026):** etapas 1–6 concluídas — entregáveis em `docsPIM-IV/planejamento/` (inventário, plano de componentes, modelo de dados + diagrama ER, contrato da API, gap do backend e plano de implementação). **Etapa 7 (revisão e aprovação do grupo) pendente** — é o gatilho para iniciar a fase de código.

---

## Visão Geral

| # | Etapa | Entregável (apenas documentação) | Depende de | Status |
|---|-------|----------------------------------|------------|--------|
| 1 | Inventário do protótipo | `docsPIM-IV/planejamento/01_INVENTARIO_FRONT.md` | — | Concluído |
| 2 | Plano de componentização React | `docsPIM-IV/planejamento/02_PLANO_COMPONENTES.md` | 1 | Concluído |
| 3 | Modelo de dados | `docsPIM-IV/planejamento/03_MODELO_DADOS.md` + `planejamento/diagramas/DIAGRAMA_ER.md` | 1 | Concluído |
| 4 | Contrato da API | `docsPIM-IV/planejamento/04_CONTRATO_API.md` | 1, 3 | Concluído |
| 5 | Análise do backend atual (gap) | `docsPIM-IV/planejamento/05_GAP_BACKEND.md` | 3, 4 | Concluído |
| 6 | Plano de implementação e testes | `docsPIM-IV/planejamento/06_PLANO_IMPLEMENTACAO.md` | 2, 4, 5 | Concluído |
| 7 | Revisão e aprovação | Ata/checklist de aprovação | 1–6 | Pendente |

> As etapas **2 e 3 podem ser feitas em paralelo**, pois dependem apenas do inventário.

---

## Etapa 1 — Inventário do protótipo (`index.html`)

**Objetivo:** saber exatamente o que o protótipo faz e quais dados ele usa.

- [x] 1.1 Listar todas as telas e seções (Dashboard, Transações, Orçamentos, Copilot IA, Configurações, modais, etc.)
- [x] 1.2 Para cada tela, registrar:
  - [x] dados exibidos (campos, formatos, cálculos)
  - [x] ações do usuário (criar, editar, excluir, filtrar, ordenar, exportar)
  - [x] estados (vazio, carregando, erro)
- [x] 1.3 Marcar as funcionalidades **novas** em relação ao backend atual
- [x] 1.4 Identificar tudo que hoje vive só no JS/`localStorage` e precisará ir para o servidor
- [x] 1.5 Extrair as regras de negócio embutidas no JS (limites, alertas, totais, insights)
- [x] 1.6 Separar o que é **apenas interface** (tema, modo discreto, PWA, animações) e não exige backend
- [x] 1.7 Mapear o CSS: variáveis do design system, temas e breakpoints

**Entregável:** tabela *tela → dados → ações → precisa de backend? (sim/não)*.
**Aceite:** nenhuma funcionalidade do protótipo fica fora do documento.

---

## Etapa 2 — Plano de componentização React

**Objetivo:** desenhar no papel como o HTML será dividido, sem mexer no código.

- [x] 2.1 Definir a árvore de componentes (layout, telas, modais, botão flutuante de IA, gráficos)
- [x] 2.2 Identificar componentes reutilizáveis e seus props
- [x] 2.3 Definir o mapa de rotas (`/login`, `/dashboard`, `/transacoes`, ...) e quais são protegidas
- [x] 2.4 Definir a gestão de estado (contextos, hooks, o que é local vs. global)
- [x] 2.5 Definir a estrutura de pastas do front
- [x] 2.6 Definir a estratégia de CSS (tokens, arquivos por componente, temas)
- [x] 2.7 Avaliar o `frontend/src/` atual: o que está alinhado ao protótipo (aproveitar) e o que está defasado (descartar)
- [x] 2.8 Definir a camada de serviços (`services/`): lista de módulos e funções esperadas, para trocar mock por API depois
- [x] 2.9 Listar dependências a adicionar (ex.: `react-router-dom`, `recharts`, `vitest`, Testing Library)

**Entregável:** árvore de componentes, mapa de rotas e estrutura de pastas.
**Aceite:** todo item de interface do inventário tem um componente ou tela correspondente.

---

## Etapa 3 — Modelo de dados

**Objetivo:** definir as entidades que o backend precisará guardar.

- [x] 3.1 Derivar as entidades e atributos a partir do inventário (ex.: Usuário, Transação, Categoria, Orçamento, Alerta, Conversa IA, Insight, Configuração — ajustar conforme o inventário)
- [x] 3.2 Definir relacionamentos e cardinalidades
- [x] 3.3 Definir tipos, obrigatoriedade e regras (valores monetários como `decimal`, datas ISO 8601, enums)
- [x] 3.4 Definir estratégia de auditoria e exclusão (lógica ou física)
- [x] 3.5 Avaliar se o SQLite atende ou se outro banco é necessário
- [x] 3.6 Produzir o diagrama ER (em `docsPIM-IV/planejamento/diagramas/`)

**Entregável:** dicionário de dados + diagrama ER.
**Aceite:** todo dado exibido no front tem origem identificada no modelo.

---

## Etapa 4 — Contrato da API

**Objetivo:** especificar os endpoints necessários, sem implementá-los.

- [x] 4.1 Definir as convenções: prefixo `/api/v1`, JWT, paginação, filtros, ordenação, formato de erro, datas e valores
- [x] 4.2 Para cada tela, listar os endpoints (método, rota, parâmetros, request, response, códigos de erro)
- [x] 4.3 Definir os endpoints agregados do dashboard, evitando que o front calcule tudo
- [x] 4.4 Definir o contrato do Copilot/IA (enviar mensagem, histórico, insights; streaming ou não)
- [x] 4.5 Definir os critérios de autorização por recurso (cada usuário acessa só os seus dados)
- [x] 4.6 Escrever o contrato (Markdown ou OpenAPI)
- [x] 4.7 Validar: cada tela consegue ser montada só com as respostas descritas?

**Entregável:** documento do contrato + tabela *tela → endpoints*.
**Aceite:** toda ação do inventário tem um endpoint correspondente.

---

## Etapa 5 — Análise do backend atual (gap)

**Objetivo:** comparar o backend existente com o contrato e decidir o que reaproveitar.

- [x] 5.1 Levantar o que existe hoje (controllers, entidades, serviços, validators, migrations, seed)
- [x] 5.2 Classificar cada item como **manter**, **alterar** ou **remover**
- [x] 5.3 Listar o que precisa ser criado do zero
- [x] 5.4 Decidir a estratégia do banco (recriar migrations vs. evoluir) e confirmar se há dados reais a preservar
- [x] 5.5 Avaliar a base técnica reaproveitável (JWT, BCrypt, EF Core, Serilog, FluentValidation, Docker, Nginx)
- [x] 5.6 Listar as pendências de segurança (segredos, `.db` e `.env` fora do tracking, CORS)

**Entregável:** tabela *item atual → ação (manter/alterar/remover/criar)*.
**Aceite:** todo endpoint do contrato indica se é novo ou adaptação de um existente.

---

## Etapa 6 — Plano de implementação e testes

**Objetivo:** planejar a fase de código para ser executada depois.

- [x] 6.1 Ordenar os recursos por prioridade (sugestão: Auth → Categorias → Transações → Orçamentos → Dashboard → Alertas → Copilot IA → demais)
- [x] 6.2 Quebrar em tasks pequenas e atômicas, separadas por área (`frontend`, `backend`, `db`, `docs`, `infra`)
- [x] 6.3 Definir a estratégia de testes: Vitest + Testing Library no front; `dotnet test` com banco em memória no back; IA e APIs externas sempre mockadas
- [x] 6.4 Definir a estratégia de integração (mocks seguindo o contrato até o backend ficar pronto)
- [x] 6.5 Estimar esforço e riscos, e relacionar ao prazo do PIM
- [x] 6.6 Definir a lista de commits previstos, no padrão do `git.md`

**Entregável:** documento de tasks de implementação (a ser executado em outra fase).
**Aceite:** cada task é pequena, testável e tem critério de pronto.

---

## Etapa 7 — Revisão e aprovação

- [ ] 7.1 Revisão do grupo sobre inventário, modelo de dados e contrato
- [ ] 7.2 Fechar as decisões pendentes (tabela abaixo)
- [ ] 7.3 Registrar a aprovação e liberar o início da implementação

---

## Decisões Pendentes

| Item | Dúvida | Etapa | Recomendação (detalhes) |
|------|--------|-------|------------------------|
| Provedor de IA | Qual serviço usar e como tratar custo e limites | 4.4 | Abstrair em `ICopilotAiClient` (LLM com function calling, chave/base/modelo via env) + fallback rule-based + cota diária. Ver 04 §11 e 06 §5 |
| Banco de dados | SQLite basta? | 3.5 | **Sim, nesta fase** (escala acadêmica, volume Docker, EF Core permite troca futura). Ver 03 §7 |
| Dados atuais | Existe dado real a migrar? | 5.4 | **Não** — banco atual é 100% regenerável do seed → recriar migrations. Ver 05 §4 |
| Escopo | Quais funcionalidades novas entram na primeira entrega do PIM? | 1.3 | P1 = Auth/OTP, categorias, transações, orçamentos, dashboard, alertas, copilot, relatórios, configurações; P2 = importação, exportações, zona de perigo. Ver 01 §6 e 06 §1 |

## Regras desta fase

1. Nenhum arquivo de código (`.jsx`, `.css`, `.cs`, `.sql`, `Dockerfile`, etc.) é criado ou alterado.
2. Os entregáveis ficam em `docsPIM-IV/` e são commitados como `docs: ...`, em português, no padrão do `git.md`.
3. Nenhuma credencial, token ou connection string é escrito nos documentos.
