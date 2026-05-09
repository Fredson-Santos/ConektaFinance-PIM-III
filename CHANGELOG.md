# 📋 CHANGELOG — PIM III

Todas as mudanças significativas neste projeto serão documentadas neste arquivo.


O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto segue [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### 🚀 Planned (Próximas Sprints)
- Frontend: Modal criar/editar gasto (TASK-007)
- Frontend: Features adicionais - Alertas, Insights, Relatórios (TASK-008)
- Frontend: Integração com API (TASK-009)
- Backend: Estrutura base .NET + Autenticação JWT (TASK-010)
- Backend: API CRUD Gastos e Categorias (TASK-011)
- Backend: Relatórios e Alertas (TASK-012)
- Testes: Unitários backend (TASK-013)
- QA: Acessibilidade WCAG AA (TASK-014)
- QA: Testes Responsivos e Cross-browser (TASK-015)
- Integração: E2E testing (TASK-016)
- Documentação: API + ABNT (TASK-018 + TASK-019)

---

## [0.4.0] — 2026-05-09 — Design System & Protótipos HTML

### ✨ Added
- **Design System completo** (docs/design-system.md)
  - Paleta de cores (primária, secundária, status, neutra)
  - Tipografia: DM Serif Display + DM Sans
  - Componentes base: Button, Input, Card, Modal, Toast
  - Grid 12 colunas + spacing system
  - Breakpoints: 375px (mobile), 768px (tablet), 1024px (desktop)
  - Ícones e espaçamento

- **4 Protótipos HTML/CSS MVP** (telas estáticas)
  - `frontend/tela-login.html` — Autenticação com validação visual
  - `frontend/tela-cadastro.html` — Registro de novo usuário
  - `frontend/tela-dashboard.html` — Dashboard com KPIs mockados
  - `frontend/tela-gastos.html` — Tabela de gastos com responsividade

### 🎯 Status
- **TASK-006**: ✅ Concluído
- Design System e protótipos testados em 375px, 768px, 1024px
- CSS semântico com variáveis reutilizáveis
- Sem dependências externas (JS puro para validação)

---

## [0.3.0] — 2026-05-07 — Personas & Pesquisa de Usuários

### ✨ Added
- **Documento de Personas** (docs/personas.md)
  - 3 personas principais: Marco (autônomo), Júlia (assalariada), Pedro (empresário)
  - Mapa de empatia para cada persona
  - Jobs to be done (JTBD)
  - User journey mapping

### 🎯 Status
- **TASK-005**: ✅ Concluído
- Personas validadas com requisitos funcionais (RF1-RF15)

---

## [0.2.0] — 2026-04-28 — Planejamento Ágil & Sprints

### ✨ Added
- **Sprints definidas** (docs/planejamento/ROADMAP.md)
  - Sprint 1: Login + Autenticação + Dashboard
  - Sprint 2: Gestão de Gastos + Categorias
  - Sprint 3: Relatórios + Alertas + Testes

- **Requisitos funcionais (RF1-RF15)** e não-funcionais (RNF1-RNF8)
- **Backlog priorizado** (P0, P1, P2)
- **Stakeholders identificados**

### 🎯 Status
- **TASK-002**: ✅ Concluído — Stakeholders e Requisitos
- **TASK-003**: ✅ Concluído — Definição de Sprints

---

## [0.1.0] — 2026-04-20 — Definição do Negócio & Dados

### ✨ Added
- **Empresa fictícia**: Conekta (Software House)
- **Público-alvo e problemas identificados**
- **Modelo de Dados relacional**
  - Diagrama ER: USUARIO, CATEGORIA, TRANSACAO, ORCAMENTO, ALERTA
  - SQL definido com índices e constraints
  - 5 tabelas normalizadas (3FN)
  - Arquivo: `docs/diagramas/der-diagram.puml`

- **Documentação de Arquitetura**
  - Justificativa: SQL vs NoSQL
  - Modelo relacional vs documentos
  - Escolha: MySQL/PostgreSQL com Entity Framework Core (.NET)

- **Pasta de estrutura base**
  - `docs/diagramas/` — Diagramas PlantUML
  - `docs/planejamento/` — Roadmap e escopo
  - `docs/tasks/` — TASKS.md com 21 tarefas

### 🎯 Status
- **TASK-001**: ✅ Concluído — Definição da Empresa
- **TASK-004**: ✅ Concluído — Modelo de Dados (DER + SQL)

---

## 📊 Status por Fase

| Fase | Status | Progresso |
|------|--------|-----------|
| 🟢 Fase 1: Definição do Negócio | ✅ Concluída | 100% |
| 🔵 Fase 2: Planejamento Ágil | ✅ Concluída | 100% |
| 🟣 Fase 3: Modelagem de Dados | ✅ Concluída | 100% |
| 🟡 Fase 4: UX/UI e Design | ✅ Concluída | 100% |
| 🔴 Fase 5: Frontend | 🔴 Não Iniciada | 0% |
| 🔴 Fase 5B: Backend | 🔴 Não Iniciada | 0% |
| ⚪ Fase 6: Integração & QA | ⏳ Planejado | — |
| ⚪ Fase 7: Documentação | ⏳ Planejado | — |
| ⚪ Fase 8: Deploy | ⏳ Planejado | — |

---

## 🔗 Links Úteis

- [TASKS.md](docs/tasks/TASKS.md) — Planejamento detalhado de todas as tarefas
- [Design System](docs/design-system.md) — Guia visual e componentes
- [Personas](docs/personas.md) — Perfis de usuários
- [DER Diagram](docs/diagramas/der-diagram.puml) — Modelo de dados
- [ROADMAP](docs/planejamento/ROADMAP.md) — Cronograma de sprints

---

## 📝 Notas

- Versioning inicia em 0.1.0 (pré-release até go-live)
- MVP planejado para versão 1.0.0
- Cada TASK concluída gera uma release minor
- Breaking changes incrementarão versão major

---

**Última atualização:** 09 de maio de 2026  
**Próxima etapa:** TASK-007 — Modal Criar/Editar Gasto (Frontend)
