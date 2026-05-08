# 🚀 Roadmap PIM III — Modelo Corporativo

## 📌 Visão do Projeto
Desenvolvimento de um sistema web completo para um negócio fictício, simulando um ambiente corporativo real.

- 👥 Equipe: 6 pessoas  
- 🎯 Objetivo: Sistema funcional + documentação acadêmica (ABNT)  
- 🏢 Contexto: Simulação de uma software house  

---

# 📚 Disciplinas Abordadas

Este PIM integra as seguintes disciplinas do curso:

1. **Desenvolvimento Web Responsivo** (Frontend HTML/CSS/JavaScript)
2. **Engenharia de Software Ágil Aplicada** (Metodologia, Planejamento, Sprints)
3. **Modelagem de Banco de Dados e NoSQL** (DER, SQL, Relacionamentos)
4. **Programação Orientada a Objetos com C#** (Backend, API, Lógica de Negócio)
5. **UX e UI Design** (Design System, Protótipos, Experiência do Usuário)
6. **Machine Learning e Análise de Dados** (Relatórios, Insights, Previsões)
7. **Comunicação, Liderança e Negociação** (Gestão de Stakeholders, Decisões)
8. **Língua Brasileira de Sinais - LIBRAS** (Acessibilidade, Inclusão)

---

# 👥 Estrutura da Equipe

## 🔹 1. Tech Lead / Líder do Projeto
- Organização do time
- Definição da arquitetura
- Integração final do sistema

## 🔹 2. Product Owner (PO)
- Levantamento de requisitos
- Gestão do backlog
- Priorização das funcionalidades

## 🔹 3. Backend Developer
- Lógica do sistema
- Desenvolvimento em C#
- Integração com banco de dados

## 🔹 4. Frontend Developer
- Criação das interfaces
- Responsividade
- Integração com backend

## 🔹 5. Data / Database Engineer
- Modelagem de dados
- Estrutura do banco
- Análise de dados / ML

## 🔹 6. UX/UI + Documentação
- Wireframes e protótipos
- Personas
- Padronização do PIM (ABNT)

---

# 🧱 Fases do Projeto

## 🟢 Fase 1 — Definição do Negócio 
### 🎯 Objetivo:
Definir a empresa fictícia

### 📦 Entregas:
- Nome da empresa = **Conekta**
- Segmento = **Software House**
- Público-alvo = **Jovens Adultos / Pessoas que querem se organizar financeiramente**
- Problema a ser resolvido = **Desorganização financeira**
- Descrição dos serviços = **Sistema de controle financeiro moderno**

---

## 🔵 Fase 2 — Planejamento Ágil 
### 🎯 Objetivo:
Organizar o projeto

### 📦 Entregas:

#### 👥 Stakeholders:
- **Usuários Finais:** Jovens adultos (18-35 anos) que buscam organização financeira
- **Product Owner:** Responsável pela priorização de features
- **Backend Team:** Desenvolvimento da API em C#
- **Frontend Team:** Interface web responsiva
- **Database Engineer:** Modelagem e otimização do banco

#### ✅ Requisitos Funcionais (RF):

**Autenticação:**
- RF1: Login com email/senha
- RF2: Sessão de usuário

**Dashboard:**
- RF3: Visualizar resumo financeiro (4 KPIs)
- RF4: Gráficos de despesas por categoria (Chart.js)
- RF5: Tabela de últimas transações
- RF6: Navegação por sidebar responsiva
- RF7: Filtro por período (mês/ano)

**Gestão de Gastos:**
- RF8: Listar todas as despesas com paginação
- RF9: Criar nova despesa (form modal)
- RF10: Editar despesa
- RF11: Deletar despesa
- RF12: Categorizar gastos (Alimentação, Transporte, Lazer, Saúde, Moradia)

**Relatórios:**
- RF13: Visualizar KPIs em relatórios (Total, Orçamento, Comparação)
- RF14: Gráficos básicos de despesas (linha, barra)
- RF15: Relatório por categoria com progress bar e análise de padrões

#### ⚙️ Requisitos Não Funcionais (RNF):

- RNF1: Design responsivo (mobile-first)
- RNF2: Design System (cores Verde/Teal, tipografia DM)
- RNF3: Performance: Carregamento < 2s
- RNF4: Compatibilidade: Chrome, Firefox, Safari
- RNF5: Acessibilidade WCAG AA + Suporte a LIBRAS
- RNF6: Segurança: Autenticação JWT, HTTPS, validação
- RNF7: Escalabilidade: Suportar até 10k transações
- RNF8: Documentação Ágil com sprints

#### 📊 Backlog Priorizado:

**P0 - MVP (Sprint 1-2):**
- Tela de Login (existente, precisa integração backend)
- Tela de Dashboard (existente, precisa dados reais)
- CRUD Gastos básico (existente, precisa backend)

**P1 (Sprint 2-3):**
- Relatórios com gráficos (existente, precisa dados dinâmicos)
- Sistema de categorias
- Alertas automáticos

**P2 (Sprint 3+):**
- IA para insights e previsões
- Exportação de PDF

#### 📈 Priorização MVP:
1. **Sprint 1:** Login + Autenticação + Dashboard básico
2. **Sprint 2:** Gestão de Gastos (CRUD) + Categorias + Persistência
3. **Sprint 3:** Relatórios dinâmicos + Alertas + Testes

### 🛠️ Ferramentas:
- 📋 Gestão: Trello / Notion / Jira
- 💻 Código: GitHub
- 📝 Documentação: Confluence / Wiki

---

## 🟣 Fase 3 — Modelagem de Dados 
### 🎯 Objetivo:
Estruturar o banco de dados

### 📦 Entregas:

#### 📊 Modelo Conceitual (DER):
**Entidades Principais:**
- **USUARIO** — Usuários da plataforma
- **CATEGORIA** — Categorias de gastos
- **TRANSACAO** — Gastos/Transações
- **ORCAMENTO** — Orçamentos por categoria
- **ALERTA** — Sistema de alertas

**Relacionamentos:**
- USUARIO (1) ↔ (N) TRANSACAO
- USUARIO (1) ↔ (N) ORCAMENTO
- USUARIO (1) ↔ (N) ALERTA
- CATEGORIA (1) ↔ (N) TRANSACAO
- CATEGORIA (1) ↔ (N) ORCAMENTO

#### 💾 Tabelas SQL (Modelo Lógico):

**usuarios**
- usuario_id (INT, PK, AUTO_INCREMENT)
- email (VARCHAR 255, UNIQUE, NOT NULL)
- senha_hash (VARCHAR 255, NOT NULL)
- nome_completo (VARCHAR 255, NOT NULL)
- tipo_conta (VARCHAR 50) — "Conta pessoal"
- data_criacao (TIMESTAMP DEFAULT NOW())
- data_atualizacao (TIMESTAMP DEFAULT NOW())

**categorias**
- categoria_id (INT, PK, AUTO_INCREMENT)
- nome (VARCHAR 100, NOT NULL) — Alimentação, Transporte, etc
- descricao (TEXT)
- codigo_cor (VARCHAR 7) — Código hexadecimal (#27500A)
- icone (VARCHAR 50) — Nome do ícone SVG
- data_criacao (TIMESTAMP DEFAULT NOW())

**transacoes**
- transacao_id (INT, PK, AUTO_INCREMENT)
- usuario_id (INT, FK → usuarios)
- categoria_id (INT, FK → categorias)
- descricao (VARCHAR 255, NOT NULL)
- valor (DECIMAL 10,2, NOT NULL)
- data_transacao (DATE, NOT NULL)
- observacao (TEXT)
- eh_recorrente (BOOLEAN DEFAULT FALSE)
- status (VARCHAR 20) — "ativa", "deletada"
- data_criacao (TIMESTAMP DEFAULT NOW())
- data_atualizacao (TIMESTAMP DEFAULT NOW())

**orcamentos**
- orcamento_id (INT, PK, AUTO_INCREMENT)
- usuario_id (INT, FK → usuarios)
- categoria_id (INT, FK → categorias)
- valor_limite (DECIMAL 10,2, NOT NULL)
- mes_periodo (INT) — Mês (1-12)
- ano_periodo (INT) — Ano
- data_criacao (TIMESTAMP DEFAULT NOW())
- data_atualizacao (TIMESTAMP DEFAULT NOW())

**alertas**
- alerta_id (INT, PK, AUTO_INCREMENT)
- usuario_id (INT, FK → usuarios)
- tipo (VARCHAR 50) — "orcamento_excedido", "gasto_alto"
- mensagem (TEXT, NOT NULL)
- categoria_id (INT, FK → categorias) — Opcional
- foi_lido (BOOLEAN DEFAULT FALSE)
- data_criacao (TIMESTAMP DEFAULT NOW())

#### 🔑 Índices e Constraints:
- **UNIQUE:** usuarios(email)
- **INDEX:** transacoes(usuario_id, data_transacao)
- **INDEX:** orcamentos(usuario_id, mes_periodo, ano_periodo)
- **INDEX:** alertas(usuario_id, foi_lido)
- **FOREIGN KEYS:** Integridade referencial entre tabelas

#### 📋 Justificativa (SQL vs NoSQL):
**Escolher: SQL (MySQL/PostgreSQL)**
- ✅ Estrutura relacional clara (Usuario → Transações, Orçamentos)
- ✅ Integridade de dados com constraints
- ✅ Queries agregadas para relatórios (SUM, GROUP BY)
- ✅ ACID compliance para transações financeiras
- ❌ NoSQL seria inadequado (dados estruturados, relações fortes)

#### 🔗 Relacionamentos e Cardinalidade:
- 1 USUARIO → N TRANSACOES (um usuário, múltiplos gastos)
- 1 USUARIO → N ORCAMENTOS (um usuário, múltiplos orçamentos)
- 1 CATEGORIA → N TRANSACOES (uma categoria, múltiplos gastos)
- 1 CATEGORIA → N ORCAMENTOS (uma categoria, múltiplo orçamento)
- Sem relacionamento direto TRANSACAO → ORCAMENTO (validação em aplicação)

#### 📈 Consultas Esperadas:
- Listar gastos de um usuário (filtro: data, categoria)
- Calcular total gasto por categoria (GROUP BY)
- Comparar gastos vs orçamento (JOIN TRANSACAO + ORCAMENTO)
- Gerar alertas (WHERE valor > valor_limite)
- Dashboard KPIs (SUM, COUNT, agregações)

---

## 🟡 Fase 4 — UX/UI e Protótipos 
### 🎯 Objetivo:
Desenhar a experiência do usuário

### 📦 Entregas:
- Personas
- Fluxo de navegação
- Wireframes
- Protótipos de telas

---

## 🔴 Fase 5 — Desenvolvimento 
### 🎯 Objetivo:
Construir o sistema

### 📦 Entregas:
- Backend (C#)
- Frontend (Web Responsivo)
- Integração entre sistemas
- Funcionalidades principais

### 🔁 Sprints:
- Sprint 1: Login e cadastro
- Sprint 2: Funcionalidade principal
- Sprint 3: Melhorias

---

## 🟠 Fase 6 — Análise de Dados / ML 
### 🎯 Objetivo:
Gerar valor com dados

### 📦 Entregas:
- Relatórios
- Indicadores
- Gráficos
- Previsões simples (opcional)

---

## ⚫ Fase 7 — Comunicação e Inclusão 
### 🎯 Objetivo:
Simular ambiente corporativo

### 📦 Entregas:
- Estratégias de comunicação
- Liderança e decisões
- Negociação de requisitos
- Inclusão (LIBRAS)

---

## 🟤 Fase 8 — Integração Final 
### 🎯 Objetivo:
Unificar o sistema

### 📦 Entregas:
- Sistema integrado
- Testes básicos
- Ajustes finais

---

## ⚪ Fase 9 — Documentação Final 
### 🎯 Objetivo:
Montar o PIM

### 📦 Entregas:
- Introdução
- Desenvolvimento (20–30 páginas)
- Conclusão
- Referências (ABNT)

---


# 🏁 Entrega Oficial

📅 **23/05/2026 (Sábado)** — Postagem do PIM pelos alunos


---

# 🔁 Rotina da Equipe

## 📅 Reunião Semanal
- O que foi feito
- O que será feito
- Problemas encontrados

## ⚡ Daily (opcional)
- Atualizações rápidas (WhatsApp)

---

# 🛠️ Ferramentas Recomendadas

- 📋 Gestão: Trello / Notion  
- 🎨 UX/UI: Figma  
- 💻 Código: GitHub  
- 🗄️ Banco: MySQL / MongoDB  
- 📝 Documentação: Word (ABNT)  

---

# 📈 Diferenciais para Nota Alta

- ✔ Backlog organizado
- ✔ Prints do sistema
- ✔ Código comentado
- ✔ Diagramas (DER, fluxo)
- ✔ Integração clara entre etapas

---

# 🧠 Estratégia Final

> Este projeto deve ser tratado como um produto real, desenvolvido para um cliente, e não apenas como um trabalho acadêmico.

---