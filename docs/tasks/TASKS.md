# 📋 TAREFAS PIM III — Planejamento Completo

---

## 🔍 ÍNDICE POR SEGMENTO

### 📊 **Estratégia & Planejamento** (Definição de Negócio)
- [TASK-001](#task-001-definição-da-empresa-fictícia) — Definição da Empresa
- [TASK-002](#task-002-stakeholders-e-requisitos) — Stakeholders e Requisitos
- [TASK-003](#task-003-definição-de-sprints) — Definição de Sprints

### 🗄️ **Dados & Arquitetura** (Modelagem)
- [TASK-004](#task-004-modelo-de-dados-der--sql) — Modelo de Dados (DER + SQL)

### 🎨 **Design & UX/UI** (Experiência do Usuário)
- [TASK-005](#task-005-personas-e-pesquisa-de-usuários) — Personas e Pesquisa
- [TASK-006](#task-006-design-system--protótipos-html-mvp) — Design System + Protótipos HTML

### 💻 **Frontend** (Interface Web)
- [TASK-007](#task-007-modal-criareditar-gasto--tela-categorias) — Modal + Categorias
- [TASK-008](#task-008-features-adicionais-alertas-insights-relatórios) — Features Adicionais
- [TASK-009](#task-009-integração-com-backend-api--javascript) — Integração API

### ⚙️ **Backend** (API & Servidor)
- [TASK-010](#task-010-estrutura-base-net--autenticação-jwt) — Estrutura Base .NET
- [TASK-011](#task-011-api-crud-mvp-gastos-categorias) — API CRUD MVP
- [TASK-012](#task-012-relatórios-e-alertas-backend) — Relatórios e Alertas
- [TASK-013](#task-013-testes-unitários--qa) — Testes Unitários

### ♿ **Qualidade & Acessibilidade** (Testes)
- [TASK-014](#task-014-acessibilidade-wcag-aa) — Acessibilidade
- [TASK-015](#task-015-testes-responsivos-e-cross-browser) — Testes Responsivos

### 🚀 **Integração & Deploy** (Finalização)
- [TASK-016](#task-016-integração-frontend--backend-e2e) — Integração E2E
- [TASK-017](#task-017-testes-de-aceitação--relatório-qa) — Testes QA

### 📚 **Documentação** (Entrega Final)
- [TASK-018](#task-018-documentação-de-api--readme) — Documentação de API
- [TASK-019](#task-019-documentação-pim-abnt) — Documentação PIM (ABNT)
- [TASK-020](#task-020-preparação-para-apresentação) — Preparação para Apresentação
- [TASK-021](#task-021-deploy-e-configuração-de-produção) — Deploy (Opcional)

---

## 🟢 FASE 1 — Definição do Negócio [CONCLUÍDA ✅]

### TASK-001: Definição da Empresa Fictícia
- [x] Nome empresa: Conekta
- [x] Segmento: Software House
- [x] Público-alvo definido
- [x] Problema identificado
- [x] Descrição de serviços

---

## 🔵 FASE 2 — Planejamento Ágil [CONCLUÍDA ✅]

### TASK-002: Stakeholders e Requisitos
- [x] Levantamento de stakeholders
- [x] Requisitos funcionais (RF1-RF15)
- [x] Requisitos não-funcionais (RNF1-RNF8)
- [x] Backlog priorizado (P0, P1, P2)

### TASK-003: Definição de Sprints
- [x] Sprint 1: Login + Autenticação + Dashboard
- [x] Sprint 2: Gestão de Gastos + Categorias
- [x] Sprint 3: Relatórios + Alertas + Testes

---

## 🟣 FASE 3 — Modelagem de Dados [CONCLUÍDA ✅]

### TASK-004: Modelo de Dados (DER + SQL)
- [x] Diagrama conceitual criado (der-diagram.puml)
- [x] Entidades definidas (USUARIO, CATEGORIA, TRANSACAO, ORCAMENTO, ALERTA)
- [x] Relacionamentos modelados
- [x] Tabelas SQL definidas
- [x] Índices e constraints especificados
- [x] Justificativa SQL vs NoSQL

---

## 🟡 FASE 4 — UX/UI e Design [🟡 EM ANDAMENTO]

### TASK-005: Personas e Pesquisa de Usuários
**Status:** ✅ Concluído  
**Prioridade:** P0  
**Assignee:** UX/UI Designer

#### Subtasks:
- [x] TASK-005.1: Criar 3 personas principais
- [x] TASK-005.2: Mapa de empatia
- [x] TASK-005.3: Jobs to be done (JTBD)
- [x] TASK-005.4: User journey mapping

**Saída:** `docs/personas.md` ✅

---

### TASK-006: Design System + Protótipos HTML (MVP)
**Status:** ✅ Concluído  
**Prioridade:** P0  
**Assignee:** UX/UI Designer + Frontend Developer

#### Subtasks:
- [x] TASK-006.1: Design System Essencial
  - [x] Paleta de cores (primária, secundária, status, neutra)
  - [x] Tipografia (DM Serif Display + DM Sans)
  - [x] Componentes base: Button, Input, Card, Modal, Toast
  - [x] Grid 12 colunas + spacing system
  - [x] Breakpoints: 375px (mobile), 768px (tablet), 1024px (desktop)
  - [x] Arquivo: `docs/design-system.md` ✅

- [x] TASK-006.2: Protótipos HTML (5 telas MVP)
  - [x] Tela Login (HTML + CSS, responsive) ✅
  - [x] Tela Cadastro (HTML + CSS, responsive) ✅
  - [x] Tela Dashboard (HTML + CSS, responsive, sem API) ✅
  - [x] Tela Gastos (HTML + CSS, responsive, sem API) ✅
  - [x] Tela Relatórios (HTML + CSS, responsive, sem API) ✅
  - [x] CSS semântico com variáveis do design system ✅
  - [x] Mobile-first: 375px, 768px, 1024px ✅

**Entrada:** Personas (TASK-005)  
**Saída:** `docs/design-system.md` + 5 telas HTML/CSS responsivas (protótipos estáticos) ✅

---

## 🔴 FASE 5 — Desenvolvimento Frontend [🔴 EM ANDAMENTO]

### TASK-007: Modal Criar/Editar Gasto + Tela Categorias
**Status:** 🟡 Em andamento  
**Prioridade:** P0  
**Assignee:** Frontend Developer

#### Subtasks:
- [ ] TASK-007.1: Modal criar/editar gasto
  - [ ] Form: valor, descrição, categoria, data
  - [ ] Validação visual (CSS)
  - [ ] Abrir/fechar (button click, escape key)
  - [ ] Accessibility: focus management, aria-labels

- [ ] TASK-007.2: Tela Categorias (CRUD visual)
  - [ ] Lista de categorias com cards
  - [ ] Botão "Nova categoria"
  - [ ] Modal criar/editar categoria
  - [ ] Botões delete com confirmação modal
  - [ ] Responsivo

**Entrada:** TASK-006  
**Saída:** Modal integrado em tela-gastos.html + tela-categorias.html funcional (sem API)

---

### TASK-008: Features Adicionais (Alertas, Insights, Relatórios)
**Status:** ⏳ Não iniciado  
**Prioridade:** P1  
**Assignee:** Frontend Developer

#### Subtasks:
- [ ] TASK-008.1: Tela Alertas
  - [ ] Lista de alertas com cards
  - [ ] Tipos visuais: orçamento_excedido, gasto_alto, categoria_limite
  - [ ] Botões: marcar como lido, deletar
  - [ ] Responsivo

- [ ] TASK-008.2: Tela Insights (IA Simulada)
  - [ ] Cards com recomendações de economia (mockadas)
  - [ ] Visualização por período (seletor)
  - [ ] Responsive

- [ ] TASK-008.3: Tela Relatórios
  - [ ] Cards de KPIs (total, saldo, maior gasto) com números mockados
  - [ ] Espaço para gráficos (Chart.js later)
  - [ ] Filtro por período
  - [ ] Responsive

**Entrada:** TASK-007  
**Saída:** 3 telas HTML/CSS adicionais (protótipos estáticos)

---

### TASK-009: Integração com Backend (API + JavaScript)
**Status:** ⏳ Não iniciado  
**Prioridade:** P0  
**Assignee:** Frontend Developer

#### Subtasks:
- [ ] TASK-009.1: Configuração de API
  - [ ] Base URL configurável
  - [ ] Headers padrão (Content-Type, Authorization)
  - [ ] Tratamento de erro global (toast)

- [ ] TASK-009.2: Autenticação
  - [ ] Login (POST /auth/login)
  - [ ] Cadastro (POST /auth/register)
  - [ ] Token JWT (localStorage)
  - [ ] Logout + redirect para login

- [ ] TASK-009.3: CRUD Gastos
  - [ ] GET /expenses (listar, popular tabela)
  - [ ] POST /expenses (modal criar)
  - [ ] PUT /expenses/:id (modal editar)
  - [ ] DELETE /expenses/:id (com confirmação)

- [ ] TASK-009.4: CRUD Categorias
  - [ ] GET /categories (listar, popular cards)
  - [ ] POST /categories (modal criar)
  - [ ] PUT /categories/:id (modal editar)
  - [ ] DELETE /categories/:id (com confirmação)

- [ ] TASK-009.5: Dashboards dinâmicos
  - [ ] GET /reports/summary (popular KPIs)
  - [ ] GET /alerts (popular lista alertas)
  - [ ] GET /insights (popular insights)

- [ ] TASK-009.6: UX melhorada
  - [ ] Toast sucesso/erro
  - [ ] Loading states (spinner)
  - [ ] Validação client-side antes envio

**Entrada:** TASK-008  
**Saída:** Frontend integrado com API funcional, todas as 7 telas operacionais

---

## 🔴 FASE 5B — Desenvolvimento Backend [NÃO INICIADO]

### TASK-010: Estrutura Base .NET + Autenticação JWT
**Status:** 🟡 Em andamento — Setup iniciado em 09/05  
**Prioridade:** P0  
**Assignee:** Backend Developer

> **🏗️ Arquitetura Definida:** ASP.NET Core com **Controllers** + **SQLite** (EF Core 8).
> Documentação completa em `.project/TASK-010-ARQUITETURA.md`.

#### Subtasks:
- [x] TASK-010.0: Definição de arquitetura
  - [x] Padrão de API: Controllers (vs Minimal API) → Controllers ✅
  - [x] Banco de dados: **SQLite** (portabilidade, zero config) ✅
  - [x] Stack definida: .NET 8, EF Core 8, JWT, BCrypt, FluentValidation ✅

- [ ] TASK-010.1: Setup projeto .NET
  - [ ] Criar projeto: `dotnet new web -n PIM-III-Backend`
  - [ ] Estrutura de pastas: API, Application, Domain, Infrastructure, Common
  - [ ] Instalar NuGet packages (SQLite, JWT, BCrypt, FluentValidation, Swagger)
  - [ ] appsettings.json configurado (Data Source=financeiro.db)

- [ ] TASK-010.2: Banco de dados
  - [ ] AppDbContext com `UseSqlite()`
  - [ ] Migrations automatizadas (`dotnet ef migrations add InitialCreate`)
  - [ ] Seed de categorias padrão

- [ ] TASK-010.3: Autenticação JWT
  - [ ] Middleware JWT
  - [ ] Endpoints: /auth/register, /auth/login
  - [ ] Token geração/validação
  - [ ] Refresh token

**Entrada:** Modelo de dados (TASK-004)  
**Saída:** API base com autenticação funcionando  
**Referência:** `.project/TASK-010-ARQUITETURA.md`

---

### TASK-011: API CRUD MVP (Gastos, Categorias)
**Status:** ⏳ Não iniciado  
**Prioridade:** P0  
**Assignee:** Backend Developer

#### Subtasks:
- [ ] TASK-011.1: CRUD Gastos
  - [ ] GET /expenses (com filtros: período, categoria)
  - [ ] GET /expenses/:id
  - [ ] POST /expenses
  - [ ] PUT /expenses/:id
  - [ ] DELETE /expenses/:id

- [ ] TASK-011.2: CRUD Categorias
  - [ ] GET /categories
  - [ ] POST /categories
  - [ ] PUT /categories/:id
  - [ ] DELETE /categories/:id

- [ ] TASK-011.3: Validação e regras de negócio
  - [ ] Email válido, senha mínimo 8 chars
  - [ ] Valor > 0, data válida
  - [ ] Usuário só vê seus dados
  - [ ] Status HTTP corretos (400, 401, 404, 500)

**Entrada:** TASK-010  
**Saída:** API endpoints testados com Postman

---

### TASK-012: Relatórios e Alertas (Backend)
**Status:** ⏳ Não iniciado  
**Prioridade:** P1  
**Assignee:** Backend Developer

#### Subtasks:
- [ ] TASK-012.1: Endpoints de Relatórios
  - [ ] GET /reports/summary (total, saldo, maior gasto)
  - [ ] GET /reports/by-category (gasto por categoria)
  - [ ] GET /reports/trend (últimos 6 meses)

- [ ] TASK-012.2: Geração de Alertas
  - [ ] Alert ao exceder orçamento categoria
  - [ ] Alert ao gasto acima da média
  - [ ] GET /alerts, PUT /alerts/:id (marcar lido), DELETE

- [ ] TASK-012.3: IA Simulada (Insights)
  - [ ] GET /insights (recomendações simples)
  - [ ] Lógica: se gasto > média, sugerir economia

**Entrada:** TASK-011  
**Saída:** Endpoints /reports/*, /alerts, /insights funcionando

---

### TASK-013: Testes Unitários + QA
**Status:** ⏳ Não iniciado  
**Prioridade:** P1  
**Assignee:** Backend Developer + QA

#### Subtasks:
- [ ] TASK-013.1: Testes unitários
  - [ ] Validação de dados
  - [ ] CRUD operations
  - [ ] Cálculos de KPIs
  - [ ] Cobertura ≥ 80%

- [ ] TASK-013.2: Testes de segurança
  - [ ] XSS, SQL injection
  - [ ] CSRF token em formulários
  - [ ] JWT validation
  - [ ] Rate limiting

- [ ] TASK-013.3: Teste de performance
  - [ ] 1.000+ transações
  - [ ] Tempo resposta < 500ms
  - [ ] Otimização de queries

**Entrada:** TASK-012  
**Saída:** Testes automatizados, cobertura relatada

---

### TASK-014: Acessibilidade (WCAG AA)
**Status:** ⏳ Não iniciado  
**Prioridade:** P1  
**Assignee:** Frontend Developer + QA

#### Subtasks:
- [ ] TASK-014.1: ARIA labels, roles, live regions
- [ ] TASK-014.2: Navegação por teclado (tab order, escape, enter)
- [ ] TASK-014.3: Contraste de cores (4.5:1 mínimo)
- [ ] TASK-014.4: Testes com screen reader (NVDA/JAWS)
- [ ] TASK-014.5: Lighthouse score ≥ 90

**Entrada:** Todas as telas  
**Saída:** Relatório de acessibilidade

---

### TASK-015: Testes Responsivos e Cross-browser
**Status:** ⏳ Não iniciado  
**Prioridade:** P1  
**Assignee:** QA

#### Subtasks:
- [ ] TASK-015.1: Testes em navegadores
  - [ ] Chrome, Firefox, Safari, Edge (desktop + mobile)
  
- [ ] TASK-015.2: Testes em dispositivos reais
  - [ ] iPhone, Android, iPad, Desktop
  - [ ] Resoluções: 375px, 768px, 1024px, 1920px

- [ ] TASK-015.3: Documentação de bugs

**Entrada:** Todas as telas  
**Saída:** Relatório de testes

---

## 🟠 FASE 6 — Integração e QA [NÃO INICIADO]

### TASK-016: Integração Frontend + Backend (E2E)
**Status:** ⏳ Não iniciado  
**Prioridade:** P0  
**Assignee:** Tech Lead + Frontend + Backend

#### Subtasks:
- [ ] TASK-016.1: Teste end-to-end (E2E)
  - [ ] Login → Dashboard → Criar gasto → Ver em tabela
  - [ ] Editar gasto → Ver alteração
  - [ ] Deletar gasto → Ver remoção
  - [ ] Gerar relatório

- [ ] TASK-016.2: Teste de fluxo completo
  - [ ] Cadastro de novo usuário
  - [ ] Setup inicial (criar categorias)
  - [ ] Registrar gastos
  - [ ] Ver relatórios
  - [ ] Receber alertas

- [ ] TASK-016.3: Ajustes finais
  - [ ] Correção de bugs encontrados
  - [ ] Performance (< 2s load)
  - [ ] Segurança (validação dados, headers)

**Entrada:** TASK-009 + TASK-012  
**Saída:** Sistema integrado funcionando

---

### TASK-017: Testes de Aceitação + Relatório QA
**Status:** ⏳ Não iniciado  
**Prioridade:** P0  
**Assignee:** QA

#### Subtasks:
- [ ] TASK-017.1: Testes de aceitação (AT)
  - [ ] Todos os requisitos funcionais testados
  - [ ] Caso positivo e negativo para cada feature

- [ ] TASK-017.2: Teste de performance final
  - [ ] Carregar 1.000+ transações
  - [ ] Tempo de resposta < 500ms
  - [ ] Testes de carga

- [ ] TASK-017.3: Relatório final de bugs
  - [ ] Lista de todos os bugs encontrados
  - [ ] Priorização (crítico, alto, médio, baixo)
  - [ ] Status de correção

**Entrada:** TASK-016  
**Saída:** Relatório QA, sistema pronto para documentação

---

## ⚪ FASE 7 — Documentação Final [NÃO INICIADO]

### TASK-018: Documentação de API + README
**Status:** ⏳ Não iniciado  
**Prioridade:** P1  
**Assignee:** Tech Lead

#### Subtasks:
- [ ] TASK-018.1: Documentação de API
  - [ ] Swagger/OpenAPI gerado
  - [ ] Ou Postman collection exportada
  - [ ] Exemplos de requisição/resposta

- [ ] TASK-018.2: README do projeto
  - [ ] Como instalar (frontend + backend)
  - [ ] Como rodar (dev mode)
  - [ ] Estrutura de pastas
  - [ ] Tecnologias usadas

**Entrada:** TASK-012 + TASK-009  
**Saída:** Documentação técnica completa

---

### TASK-019: Documentação PIM (ABNT)
**Status:** ⏳ Não iniciado  
**Prioridade:** P0  
**Assignee:** Tech Lead

#### Subtasks:
- [ ] TASK-019.1: Introdução + Contexto
- [ ] TASK-019.2: Fases do desenvolvimento (Personas → API)
- [ ] TASK-019.3: Screenshots e diagramas (DER, fluxos)
- [ ] TASK-019.4: Resultados, testes e métricas
- [ ] TASK-019.5: Conclusão e próximos passos
- [ ] TASK-019.6: Referências ABNT + Apêndices

**Entrada:** Todas as tarefas concluídas  
**Saída:** Documento Word formatado ABNT (50+ páginas)

---

### TASK-020: Preparação para Apresentação
**Status:** ⏳ Não iniciado  
**Prioridade:** P1  
**Assignee:** Tech Lead

#### Subtasks:
- [ ] TASK-020.1: Criar slides
  - [ ] Contexto e personas (2 slides)
  - [ ] Arquitetura e telas (7 slides)
  - [ ] Demo do sistema (5 slides)
  - [ ] Resultados e conclusão (2 slides)

- [ ] TASK-020.2: Preparar demo ao vivo
  - [ ] Roteiro de demonstração
  - [ ] Dados de teste carregados
  - [ ] Backup de vídeo

- [ ] TASK-020.3: Ensaio de apresentação
  - [ ] Mínimo 1 ensaio completo
  - [ ] Tempo: 15-20 minutos

**Entrada:** TASK-019  
**Saída:** Slides + vídeo demo

---

## 🟤 FASE 8 — Deploy [OPCIONAL]

### TASK-021: Deploy e Configuração de Produção
**Status:** ⏳ Não iniciado  
**Prioridade:** P2  
**Assignee:** Tech Lead

#### Subtasks:
- [ ] TASK-021.1: Configuração de ambiente
  - [ ] Variáveis de ambiente (.env)
  - [ ] Banco de dados produção
  - [ ] SSL/HTTPS

- [ ] TASK-021.2: Deploy frontend
  - [ ] Hospedagem (Vercel, Netlify ou GitHub Pages)
  - [ ] Build otimizado
  - [ ] CI/CD pipeline

- [ ] TASK-021.3: Deploy backend
  - [ ] Hospedagem (.NET - Azure, Heroku ou similar)
  - [ ] Migrations automáticas
  - [ ] Logs e monitoramento

**Entrada:** TASK-017  
**Saída:** Sistema em produção acessível via URL
**Status:** ⏳ Não iniciado  
**Prioridade:** P2  
**Assignee:** UX/UI Designer

#### Subtasks:
- [ ] TASK-026.1: Documentação de acessibilidade
  - [ ] Checklist WCAG AA
  - [ ] Relatório de testes

- [ ] TASK-026.2: Suporte a LIBRAS (conceitual)
  - [ ] Documentação sobre como integrar (plugin tipo Hand Talk)
  - [ ] Links para ferramentas
  - [ ] Não é obrigatório implementar, apenas documentar

**Entrada:** TASK-017  
**Saída:** Documentação de acessibilidade

---

### TASK-027: Documentação e Comunicação
**Status:** ⏳ Não iniciado  
**Prioridade:** P1  
**Assignee:** Tech Lead + UX/UI Designer

#### Subtasks:
- [ ] TASK-027.1: Documentação de API
  - [ ] Swagger/OpenAPI (ou Postman collection)
  - [ ] Exemplos de requisição/resposta

- [ ] TASK-027.2: README do projeto
  - [ ] Como instalar (frontend + backend)
  - [ ] Como rodar (dev mode)
  - [ ] Estrutura de pastas
  - [ ] Contribuindo ao projeto

- [ ] TASK-027.3: Guia do usuário
  - [ ] Screenshots das telas
  - [ ] Passo a passo de operações principais

**Entrada:** Todas as tarefas de desenvolvimento  
**Saída:** Documentação completa

---

## 🟤 FASE 8 — Integração Final [NÃO INICIADO]

### TASK-028: Integração Frontend + Backend
**Status:** ⏳ Não iniciado  
**Prioridade:** P0  
**Assignee:** Tech Lead + Frontend + Backend

#### Subtasks:
- [ ] TASK-028.1: Teste end-to-end (E2E)
  - [ ] Login → Dashboard → Criar gasto → Ver em tabela
  - [ ] Editar gasto → Ver alteração
  - [ ] Deletar gasto → Ver remoção
  - [ ] Gerar relatório

- [ ] TASK-028.2: Teste de fluxo completo
  - [ ] Cadastro de novo usuário
  - [ ] Setup inicial (criar categorias)
  - [ ] Registrar gastos
  - [ ] Ver relatórios
  - [ ] Definir orçamento e receber alerta

- [ ] TASK-028.3: Ajustes finais
  - [ ] Correção de bugs encontrados
  - [ ] Performance (< 2s load)
  - [ ] Segurança (validação dados, headers)

**Entrada:** Frontend + Backend completos  
**Saída:** Sistema integrado funcionando

---

### TASK-029: Testes de Aceitação e QA
**Status:** ⏳ Não iniciado  
**Prioridade:** P0  
**Assignee:** QA

#### Subtasks:
- [ ] TASK-029.1: Testes de aceitação (AT)
  - [ ] Todos os RF testados
  - [ ] Caso positivo e negativo

- [ ] TASK-029.2: Teste de performance
  - [ ] Carregar 1.000+ transações
  - [ ] Tempo de resposta < 500ms
  - [ ] Otimização de queries

- [ ] TASK-029.3: Teste de segurança
  - [ ] Validação de XSS
  - [ ] SQL injection
  - [ ] CSRF token em formulários
  - [ ] Autenticação JWT

- [ ] TASK-029.4: Relatório final de bugs
  - [ ] Lista de todos os bugs encontrados
  - [ ] Priorização (crítico, alto, médio, baixo)
  - [ ] Status de correção

**Entrada:** TASK-028  
**Saída:** Relatório QA, sistema pronto para deploy

---

### TASK-030: Deploy e Configuração de Produção
**Status:** ⏳ Não iniciado  
**Prioridade:** P1  
**Assignee:** Tech Lead

#### Subtasks:
- [ ] TASK-030.1: Configuração de ambiente
  - [ ] Variáveis de ambiente (.env)
  - [ ] Banco de dados produção
  - [ ] SSL/HTTPS

- [ ] TASK-030.2: Deploy frontend
  - [ ] Hospedagem (Vercel, Netlify, GitHub Pages)
  - [ ] Build otimizado
  - [ ] CI/CD pipeline

- [ ] TASK-030.3: Deploy backend
  - [ ] Hospedagem (Heroku, Azure, AWS)
  - [ ] Migrations automáticas
  - [ ] Logs e monitoramento

- [ ] TASK-030.4: Teste de acesso em produção
  - [ ] Sistema acessível via URL pública
  - [ ] Todas as funcionalidades testadas

**Entrada:** TASK-029  
**Saída:** Sistema em produção

---

## ⚪ FASE 9 — Documentação Final [NÃO INICIADO]

### TASK-031: Montar Documentação PIM (ABNT)
**Status:** ⏳ Não iniciado  
**Prioridade:** P0  
**Assignee:** UX/UI Designer + Tech Lead

#### Subtasks:
- [ ] TASK-031.1: Introdução
  - [ ] Contexto do projeto
  - [ ] Objetivos
  - [ ] Escopo
  - [ ] Equipe

- [ ] TASK-031.2: Desenvolvimento (20-30 páginas)
  - [ ] Fase 1: Definição do negócio
  - [ ] Fase 2: Planejamento ágil
  - [ ] Fase 3: Modelagem de dados (incluir DER)
  - [ ] Fase 4: UX/UI (personas, wireframes, protótipos)
  - [ ] Fase 5: Desenvolvimento (arquitetura, código)
  - [ ] Fase 6: Análise de dados/ML (insights, relatórios)
  - [ ] Fase 7: Acessibilidade
  - [ ] Fase 8: Integração final

- [ ] TASK-031.3: Resultados
  - [ ] Screenshots do sistema
  - [ ] Diagramas (DER, arquitetura, fluxos)
  - [ ] Tabelas de testes
  - [ ] Métricas (performance, cobertura de testes)

- [ ] TASK-031.4: Conclusão
  - [ ] Aprendizados
  - [ ] Dificuldades e soluções
  - [ ] Próximos passos (melhorias futuras)

- [ ] TASK-031.5: Referências (ABNT)
  - [ ] Livros, artigos, documentações
  - [ ] Formatação ABNT

- [ ] TASK-031.6: Apêndices
  - [ ] Código fonte (trechos principais)
  - [ ] Postman collection da API
  - [ ] Guia de instalação detalhado

**Entrada:** Todas as tarefas concluídas  
**Saída:** Documento Word formatado ABNT (50+ páginas)

---

### TASK-032: Preparação para Apresentação
**Status:** ⏳ Não iniciado  
**Prioridade:** P1  
**Assignee:** Tech Lead + UX/UI Designer

#### Subtasks:
- [ ] TASK-032.1: Criar slides da apresentação
  - [ ] Contexto e objetivo (1-2 slides)
  - [ ] Personas (1 slide)
  - [ ] Design System (1 slide)
  - [ ] Protótipos e telas (5-7 slides)
  - [ ] Arquitetura de dados (1 slide)
  - [ ] Fluxo técnico (1 slide)
  - [ ] Demo do sistema (5+ slides com prints)
  - [ ] Resultados e métricas (2 slides)
  - [ ] Conclusão (1 slide)

- [ ] TASK-032.2: Preparar demo ao vivo
  - [ ] Roteiro de demonstração
  - [ ] Dados de teste carregados
  - [ ] Backup de vídeo (caso falhe internet)

- [ ] TASK-032.3: Ensaio de apresentação
  - [ ] Mínimo 1 ensaio completo
  - [ ] Tempo: 15-20 minutos

**Entrada:** TASK-031  
**Saída:** Slides + vídeo demo

---

## 📊 RESUMO EXECUTIVO

### 🎯 PROGRESS POR SEGMENTO

| Segmento | Tasks | Concluídas | % | Status |
|----------|-------|-----------|---|--------|
| 📊 Estratégia & Planejamento | 3 | 3 | 100% | ✅ |
| 🗄️ Dados & Arquitetura | 1 | 1 | 100% | ✅ |
| 🎨 Design & UX/UI | 2 | 2 | 100% | ✅ |
| 💻 Frontend | 3 | 0 | 0% | 🔴 |
| ⚙️ Backend | 4 | 0 | 0% | 🔴 |
| ♿ Qualidade (A11y + Testes) | 2 | 0 | 0% | 🔴 |
| 🚀 Integração & QA | 2 | 0 | 0% | 🔴 |
| 📚 Documentação | 4 | 0 | 0% | ⏳ |
| **TOTAL** | **21** | **6** | **29%** | 🟡 |

### 📈 TASKS POR SEGMENTO

#### 📊 Estratégia & Planejamento (3 tasks)
- ✅ TASK-001 — Definição da Empresa
- ✅ TASK-002 — Stakeholders e Requisitos
- ✅ TASK-003 — Definição de Sprints

#### 🗄️ Dados & Arquitetura (1 task)
- ✅ TASK-004 — Modelo de Dados

#### 🎨 Design & UX/UI (2 tasks)
- ✅ TASK-005 — Personas
- ✅ TASK-006 — Design System + Protótipos HTML

#### 💻 Frontend (3 tasks)
- ⏳ TASK-007 — Modal + Categorias
- ⏳ TASK-008 — Features Adicionais
- ⏳ TASK-009 — Integração API

#### ⚙️ Backend (4 tasks)
- ⏳ TASK-010 — Estrutura Base .NET
- ⏳ TASK-011 — API CRUD MVP
- ⏳ TASK-012 — Relatórios e Alertas
- ⏳ TASK-013 — Testes Unitários

#### ♿ Qualidade (2 tasks)
- ⏳ TASK-014 — Acessibilidade
- ⏳ TASK-015 — Testes Responsivos

#### 🚀 Integração & QA (2 tasks)
- ⏳ TASK-016 — Integração E2E
- ⏳ TASK-017 — Testes de Aceitação

#### 📚 Documentação (4 tasks)
- ⏳ TASK-018 — Documentação de API
- ⏳ TASK-019 — Documentação PIM (ABNT)
- ⏳ TASK-020 — Preparação para Apresentação
- ⏳ TASK-021 — Deploy (Opcional)

---

### RESUMO POR FASE (CRONOLÓGICO)

| Fase | Total Tasks | Concluídas | % | Status |
|------|------------|-----------|---|--------|
| 1 — Definição | 1 | 1 | 100% | ✅ |
| 2 — Planejamento | 2 | 2 | 100% | ✅ |
| 3 — Dados | 1 | 1 | 100% | ✅ |
| **4 — UX/UI** | **2** | **2** | **100%** | ✅ |
| **5 — Frontend** | **3** | **0** | **0%** | 🔴 |
| **5B — Backend** | **4** | **0** | **0%** | 🔴 |
| 6 — Integração | 2 | 0 | 0% | ⏳ |
| 7 — Documentação | 4 | 0 | 0% | ⏳ |
| **TOTAL** | **19** | **6** | **32%** | 🟡 |

---

## 📅 CRONOGRAMA RECOMENDADO

```
Semana 1 (07/05 - 12/05) — UX/UI + Frontend Base
├─ TASK-005 ✅: Personas (CONCLUÍDO)
├─ TASK-006: Design System + 4 telas HTML
├─ TASK-007: Modal Gasto + Tela Categorias
└─ TASK-010: Setup .NET + Autenticação

Semana 2 (13/05 - 19/05) — Backend API + Frontend Integração
├─ TASK-008: Features adicionais (Alertas, Insights, Relatórios)
├─ TASK-009: Integração Frontend com API
├─ TASK-011: API CRUD Gastos + Categorias
└─ TASK-012: API Relatórios + Alertas

Semana 3 (20/05 - 23/05) — QA + Documentação
├─ TASK-013: Testes unitários backend
├─ TASK-014 + 015: Acessibilidade e testes responsivos
├─ TASK-016 + 017: Integração E2E + QA
├─ TASK-018 + 019: Documentação técnica + ABNT
├─ TASK-020: Preparação apresentação
└─ TASK-021: Deploy (se houver tempo)
```

---

## 🎯 PRIORIDADES

### P0 (MVP — CRÍTICO)
- TASK-005 ✅ + TASK-006 (UX/UI base)
- TASK-007 + 008 + 009 (Frontend completo)
- TASK-010 + 011 + 012 (Backend MVP)
- TASK-016 + 017 (Integração + QA)
- TASK-019 (Documentação PIM)

### P1 (IMPORTANTE)
- TASK-013 (Testes backend)
- TASK-014 + 015 (Acessibilidade + Testes responsivos)
- TASK-018 (Documentação API)
- TASK-020 (Apresentação)

### P2 (OPCIONAL)
- TASK-021 (Deploy em produção)

---

## ⚠️ DEPENDÊNCIAS CRÍTICAS

```
TASK-006 (Design System + HTML)
  ↓
  ├─→ TASK-007 + 008 + 009 (Frontend)
  └─→ TASK-010 (Backend estrutura)

TASK-009 (Frontend API integration)
  ↓
  ├─→ TASK-011 (API endpoints funcionando)
  └─→ TASK-016 (E2E tests)

TASK-012 (Relatórios + Alertas)
  ↓
  ├─→ TASK-009 (dados no frontend)
  └─→ TASK-016 (integração E2E)

TASK-009 + TASK-012
  ↓
  └─→ TASK-016 (Integração E2E)
      ↓
      └─→ TASK-017 (QA + Testes aceitação)
          ↓
          └─→ TASK-019 (Documentação ABNT)
              ↓
              └─→ TASK-020 (Apresentação)
```

---

## 📝 NOTAS

- Todas as datas são estimadas; ajustar conforme progresso real
- Daily standups recomendados para rastreamento
- Testes de acessibilidade devem ser paralelos, não sequenciais
- Backend pode ser desenvolvido em paralelo com frontend
- Documentação deve ser escrita durante o desenvolvimento, não ao final

---

## 📝 CHANGELOG

**Reorganização MVP:**
- ❌ Removido Figma: protótipos serão em HTML puro
- ❌ Reduzido de 32 para 21 tasks focado no MVP
- ✅ Frontend: 9 → 3 tasks (modalizado)
- ✅ Backend: 7 → 4 tasks (essencial apenas)
- ✅ Qualidade + Documentação consolidadas
- 📊 Progress: 22% → 24% (após mudanças)
