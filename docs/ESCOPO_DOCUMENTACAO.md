# 📋 Escopo e Documentação — Conekta PIM III

**Projeto:** Sistema de Controle Financeiro Pessoal  
**Empresa:** Conekta (Software House)  
**Data de Início:** 07/05/2026  
**Data de Entrega:** 23/05/2026  
**Versão:** 1.0

---

## 📑 Índice
1. [1️⃣ Desenvolvimento do Sistema](#1-desenvolvimento-do-sistema)
2. [2️⃣ Documentação do Projeto](#2-documentação-do-projeto)
3. [✅ Checklist de Entrega](#-checklist-de-entrega)
4. [📂 Estrutura de Arquivos](#-estrutura-de-arquivos)

---

# 1️⃣ DESENVOLVIMENTO DO SISTEMA

## 1.1 Frontend Funcional

### 🎯 Objetivo
Desenvolver uma interface web responsiva que permita aos usuários gerenciar suas finanças pessoais de forma intuitiva.

### 📦 Artefatos Esperados

#### HTML/CSS (Pronto ✅)
- **arquivo:** `tela-login.html`
  - Layout split (painel esquerdo + formulário)
  - Campos: email, senha
  - Tabs: Login / Cadastro
  - Botões: Login, Esqueci a senha, Login Google
  
- **arquivo:** `tela-dashboard.html`
  - 4 KPIs (Saldo restante, Total gasto, Gastos registrados, Maior gasto)
  - Gráficos com Chart.js (linha, rosca)
  - Tabela de últimas transações
  - Sidebar navegável
  - Filtro por período (mês/ano)

- **arquivo:** `tela-gastos.html`
  - Tabela com busca e filtros
  - Formulário sticky (criar/editar despesa)
  - Campos: valor, descrição, categoria, data, observação
  - Toggle para gastos recorrentes
  - Paginação
  - Ações: editar, deletar

- **arquivo:** `tela-relatorios.html`
  - KPIs consolidados
  - Gráficos avançados (linha, barra)
  - Tabela de distribuição por categoria
  - Progress bars de orçamento
  - Botão exportar PDF
  - Filtros de período (Semana, Mês, Trimestre, Ano)

#### JavaScript (A Desenvolver)
- [ ] Validação de formulários (email, senha, valores monetários)
- [ ] Navegação entre telas (SPA ou rotas)
- [ ] Chamadas AJAX/Fetch para Backend
- [ ] Manipulação de DOM para dados dinâmicos
- [ ] Inicialização de gráficos Chart.js com dados da API
- [ ] Paginação dinâmica
- [ ] Filtros de data e categoria

#### Design System (Pronto ✅)
- **Paleta de Cores:**
  - Verde primária: #27500A, #3B6D11
  - Teal: #1D9E75, #0F6E56
  - Alertas: Amber (#BA7517), Red (#E24B4A)
  - Neutro: Grays e White

- **Tipografia:**
  - Display: DM Serif Display (títulos)
  - Body: DM Sans (conteúdo)

- **Componentes:**
  - Cards, botões, badges, tabelas, modais, progress bars

---

## 1.2 Backend Funcional

### 🎯 Objetivo
Implementar uma API REST em C# que gerencie a lógica de negócio, autenticação e persistência de dados.

### 📦 Artefatos Esperados

#### Arquitetura (C# + ASP.NET Core)
- [ ] **Controllers:**
  - `AuthController` — POST /auth/login, POST /auth/register
  - `UsuarioController` — GET /usuarios/{id}, PUT /usuarios/{id}
  - `TransacaoController` — GET, POST, PUT, DELETE /transacoes
  - `CategoriaController` — GET /categorias
  - `OrcamentoController` — GET, POST, PUT /orcamentos
  - `RelatorioController` — GET /relatorios/{periodo}
  - `AlertaController` — GET /alertas, PUT /alertas/{id}/lido

#### Serviços (Business Logic)
- [ ] `AuthService` — Validação, JWT, hash de senha
- [ ] `TransacaoService` — CRUD, validações, cálculos
- [ ] `OrcamentoService` — Gestão de limites, comparações
- [ ] `RelatorioService` — Agregações, estatísticas
- [ ] `AlertaService` — Geração e validação de alertas

#### Data Access (Repositories)
- [ ] `UsuarioRepository` — Operações CRUD na tabela usuarios
- [ ] `TransacaoRepository` — Operações CRUD com filtros
- [ ] `CategoriaRepository` — Leitura e cache
- [ ] `OrcamentoRepository` — CRUD com período
- [ ] `AlertaRepository` — Inserção e leitura

#### Models/DTOs
- [ ] `LoginRequest` — email, senha
- [ ] `TransacaoDTO` — valor, descricao, categoria_id, data
- [ ] `OrcamentoDTO` — categoria_id, valor_limite, período
- [ ] `AlertaDTO` — tipo, mensagem, categoria_id
- [ ] `DashboardKPIs` — saldo, total_gasto, count_transacoes, maior_gasto

#### Segurança
- [ ] Autenticação JWT (token com 24h de validade)
- [ ] Hash de senha (bcrypt ou similar)
- [ ] Validação de entrada (email, CNPJ, valores)
- [ ] Autorização por usuário (apenas ver dados próprios)
- [ ] CORS configurado para Frontend

#### Tratamento de Erros
- [ ] Exceções customizadas (NotFoundException, ValidationException)
- [ ] Responses padronizadas (success/error)
- [ ] Logging estruturado (categoria, timestamp, mensagem)

---

## 1.3 Integração Entre as Camadas

### 🔗 Fluxo Esperado

#### Login
```
Frontend (POST /auth/login)
  ↓
Backend (AuthController)
  ↓
AuthService (valida credenciais)
  ↓
UsuarioRepository (busca em BD)
  ↓
JWT gerado
  ↓
Frontend (armazena token + redireciona Dashboard)
```

#### Criar Transação
```
Frontend (POST /transacoes + JWT)
  ↓
Backend (TransacaoController)
  ↓
TransacaoService (valida contra orçamento)
  ↓
TransacaoRepository (INSERT)
  ↓
AlertaService (verifica limite)
  ↓
AlertaRepository (INSERT se necessário)
  ↓
Response 201 Created
  ↓
Frontend (atualiza tabela dinâmica)
```

#### Dashboard KPIs
```
Frontend (GET /dashboard + JWT)
  ↓
Backend (DashboardController)
  ↓
RelatorioService (calcula: SUM, COUNT, MAX)
  ↓
Múltiplos Repositories (transacoes, orcamentos)
  ↓
DashboardKPIs object
  ↓
Frontend (renderiza 4 cards + gráficos)
```

### ✅ Checklist de Integração
- [ ] Frontend consome todos os endpoints
- [ ] Erros da API tratados no Frontend (toasts/modals)
- [ ] Paginação sincronizada
- [ ] Filtros funcionam end-to-end
- [ ] JWT refresh automático
- [ ] Cache de categorias no Frontend

---

## 1.4 Banco de Dados

### 📊 Estrutura SQL

#### Tabela: `usuarios`
```sql
CREATE TABLE usuarios (
  usuario_id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  nome_completo VARCHAR(255) NOT NULL,
  tipo_conta VARCHAR(50) DEFAULT 'Conta pessoal',
  data_criacao TIMESTAMP DEFAULT NOW(),
  data_atualizacao TIMESTAMP DEFAULT NOW()
);
```

#### Tabela: `categorias`
```sql
CREATE TABLE categorias (
  categoria_id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  codigo_cor VARCHAR(7),
  icone VARCHAR(50),
  data_criacao TIMESTAMP DEFAULT NOW()
);

-- Inserts padrão:
INSERT INTO categorias (nome, codigo_cor, icone) VALUES
('Alimentação', '#1D9E75', 'utensils'),
('Transporte', '#BA7517', 'car'),
('Lazer', '#3B6D11', 'smile'),
('Saúde', '#E24B4A', 'heart'),
('Moradia', '#5F5E5A', 'home');
```

#### Tabela: `transacoes`
```sql
CREATE TABLE transacoes (
  transacao_id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  categoria_id INT NOT NULL,
  descricao VARCHAR(255) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data_transacao DATE NOT NULL,
  observacao TEXT,
  eh_recorrente BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'ativa',
  data_criacao TIMESTAMP DEFAULT NOW(),
  data_atualizacao TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id),
  FOREIGN KEY (categoria_id) REFERENCES categorias(categoria_id),
  INDEX idx_usuario_data (usuario_id, data_transacao),
  INDEX idx_usuario_categoria (usuario_id, categoria_id)
);
```

#### Tabela: `orcamentos`
```sql
CREATE TABLE orcamentos (
  orcamento_id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  categoria_id INT NOT NULL,
  valor_limite DECIMAL(10,2) NOT NULL,
  mes_periodo INT NOT NULL,
  ano_periodo INT NOT NULL,
  data_criacao TIMESTAMP DEFAULT NOW(),
  data_atualizacao TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id),
  FOREIGN KEY (categoria_id) REFERENCES categorias(categoria_id),
  UNIQUE KEY unique_periodo (usuario_id, categoria_id, mes_periodo, ano_periodo),
  INDEX idx_usuario_periodo (usuario_id, mes_periodo, ano_periodo)
);
```

#### Tabela: `alertas`
```sql
CREATE TABLE alertas (
  alerta_id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  mensagem TEXT NOT NULL,
  categoria_id INT,
  foi_lido BOOLEAN DEFAULT FALSE,
  data_criacao TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id),
  FOREIGN KEY (categoria_id) REFERENCES categorias(categoria_id),
  INDEX idx_usuario_lido (usuario_id, foi_lido)
);
```

### ✅ Checklist BD
- [ ] Tabelas criadas com constraints
- [ ] Índices otimizados para queries principais
- [ ] Foreign keys configuradas
- [ ] Categorias padrão inseridas
- [ ] Script de criação documentado
- [ ] Backup automático configurado

---

# 2️⃣ DOCUMENTAÇÃO DO PROJETO

## 2.1 Levantamento de Requisitos Funcionais (RF)

### ✅ Já Documentado no ROADMAP.MD

| Categoria | RF | Descrição |
|-----------|----|-----------| 
| Autenticação | RF1 | Login com email/senha |
| Autenticação | RF2 | Sessão de usuário |
| Dashboard | RF3 | Visualizar 4 KPIs |
| Dashboard | RF4 | Gráficos por categoria |
| Dashboard | RF5 | Tabela últimas transações |
| Dashboard | RF6 | Navegação sidebar |
| Dashboard | RF7 | Filtro mês/ano |
| Gastos | RF8 | Listar com paginação |
| Gastos | RF9 | Criar gasto |
| Gastos | RF10 | Editar gasto |
| Gastos | RF11 | Deletar gasto |
| Gastos | RF12 | Categorizar gasto |
| Relatórios | RF13 | KPIs relatório |
| Relatórios | RF14 | Gráficos básicos |
| Relatórios | RF15 | Progress bar categoria |

### 📝 Formato Padronizado

**RF1: Login com email/senha**
- **Ator:** Usuário
- **Pré-condição:** Usuário cadastrado
- **Ação:** Insere email e senha
- **Resultado:** Token JWT gerado
- **Pós-condição:** Redirecionado para Dashboard
- **Exceção:** Email inválido → mensagem de erro

---

## 2.2 Levantamento de Requisitos Não Funcionais (RNF)

### ✅ Já Documentado no ROADMAP.MD

| ID | Requisito | Detalhes |
|----|-----------|----------|
| RNF1 | Design responsivo | Mobile-first, breakpoints: 320px, 768px, 1024px |
| RNF2 | Design System | Paleta, tipografia, componentes reutilizáveis |
| RNF3 | Performance | Carregamento < 2s, otimização de imagens |
| RNF4 | Compatibilidade | Chrome, Firefox, Safari (2 versões recentes) |
| RNF5 | Acessibilidade | WCAG AA, LIBRAS como diferencial |
| RNF6 | Segurança | JWT 24h, bcrypt, validação entrada |
| RNF7 | Escalabilidade | Suportar 10k transações por usuário |
| RNF8 | Documentação Ágil | Sprint reviews, wiki, API docs |

---

## 2.3 Regras de Negócio (RN)

### 💼 Regras Implementadas

#### RN1 — Limite de Orçamento
- Usuário define limite mensal por categoria
- Transação não é bloqueada, mas gera alerta
- Alerta: "Orçamento excedido em R$ X,XX"

#### RN2 — Categorias Fixas
- 5 categorias pré-definidas: Alimentação, Transporte, Lazer, Saúde, Moradia
- Não permite criar categorias customizadas no MVP

#### RN3 — Gastos Recorrentes
- Usuário marca gasto como "recorrente"
- Não replica automaticamente (apenas indicador)

#### RN4 — Transações Deletadas
- Soft delete (status = "deletada")
- Não aparecem em gráficos/relatórios
- Não removem dados do banco

#### RN5 — Período de Dados
- Dashboard padrão: mês atual
- Usuário filtra por mês/ano
- Comparações vs mês anterior

#### RN6 — Autenticação
- Email é chave única
- Senha mínimo 8 caracteres
- JWT válido por 24h

#### RN7 — Integridade Financeira
- Valores sempre em DECIMAL(10,2)
- Sem valores negativos (exceto comparações)
- Histórico imutável (não edita, recria)

#### RN8 — Alertas Automáticos
- Gerado ao criar/editar transação
- Tipos: "orcamento_excedido", "gasto_alto"
- Usuário marca como lido

### 📋 Checklist RN
- [ ] RN1 implementada no TransacaoService
- [ ] RN2 carregada em categorias padrão
- [ ] RN3 suporta toggle no formulário
- [ ] RN4 usa soft delete com status
- [ ] RN5 Dashboard filtrável
- [ ] RN6 validação em AuthService
- [ ] RN7 tipos de dados corretos
- [ ] RN8 AlertaService automático

---

## 2.4 MER — Modelo Entidade-Relacionamento

### 📊 Conceitual (Texto)

```
USUARIO
├── Atributo: usuario_id (PK)
├── Atributo: email
├── Atributo: senha_hash
├── Atributo: nome_completo
└── Atributo: tipo_conta

CATEGORIA
├── Atributo: categoria_id (PK)
├── Atributo: nome
├── Atributo: descricao
├── Atributo: codigo_cor
└── Atributo: icone

TRANSACAO
├── Atributo: transacao_id (PK)
├── FK: usuario_id
├── FK: categoria_id
├── Atributo: descricao
├── Atributo: valor
├── Atributo: data_transacao
├── Atributo: observacao
├── Atributo: eh_recorrente
└── Atributo: status

ORCAMENTO
├── Atributo: orcamento_id (PK)
├── FK: usuario_id
├── FK: categoria_id
├── Atributo: valor_limite
├── Atributo: mes_periodo
└── Atributo: ano_periodo

ALERTA
├── Atributo: alerta_id (PK)
├── FK: usuario_id
├── FK: categoria_id
├── Atributo: tipo
├── Atributo: mensagem
└── Atributo: foi_lido
```

### 🔗 Relacionamentos

| Entidade 1 | Relacionamento | Entidade 2 | Cardinalidade |
|-----------|----------------|-----------|--------------|
| USUARIO | cria | TRANSACAO | 1:N |
| USUARIO | define | ORCAMENTO | 1:N |
| USUARIO | recebe | ALERTA | 1:N |
| CATEGORIA | classifica | TRANSACAO | 1:N |
| CATEGORIA | limita | ORCAMENTO | 1:N |

### 📁 Arquivo
- **Localização:** `docs/diagramas/modelo-relacional.puml`
- **Formato:** PlantUML
- **Visualizar:** https://www.plantuml.com/plantuml/uml/

---

## 2.5 DER — Diagrama Entidade-Relacionamento

### 🖼️ Diagrama Visual

**Arquivo:** `docs/diagramas/der-diagram.puml`

Inclui:
- 5 entidades com atributos
- Chaves primárias e estrangeiras
- Cardinalidade 1:N
- Notas explicativas por entidade

**Como visualizar:**
1. Copie o conteúdo de `der-diagram.puml`
2. Acesse https://www.plantuml.com/plantuml/uml/
3. Cole e clique "Submit"
4. Exporte como PNG/SVG

---

## 2.6 Modelagem do Banco de Dados

### 📋 Documentação Completa

#### Script SQL
- **Arquivo:** `docs/scripts/schema.sql`
- **Conteúdo:** CREATE TABLE para todas as 5 tabelas
- **Índices:** Otimizados para queries esperadas
- **Seed:** Categorias padrão inseridas

#### Checklist
- [ ] Schema.sql criado e testado
- [ ] Migrations (se EF Core)
- [ ] Conexão string em appsettings.json
- [ ] Backup procedure documentado
- [ ] Plano de retenção de dados

---

## 2.7 Descrição da Arquitetura da Solução

### 🏗️ Arquitetura em Camadas

**Arquivo:** `docs/diagramas/arquitetura-sistema.puml`

```
┌─────────────────────────────────────────┐
│    Frontend (HTML/CSS/JavaScript)       │
│  • tela-login.html                      │
│  • tela-dashboard.html                  │
│  • tela-gastos.html                     │
│  • tela-relatorios.html                 │
└──────────────────┬──────────────────────┘
                   │ HTTP/REST
                   ↓
┌─────────────────────────────────────────┐
│  Backend (C# / ASP.NET Core)            │
│  • Controllers (Auth, Transacao, etc)   │
│  • Services (AuthService, etc)          │
│  • Repositories (UsuarioRepo, etc)      │
└──────────────────┬──────────────────────┘
                   │ ADO.NET / EF Core
                   ↓
┌─────────────────────────────────────────┐
│  Database (MySQL / PostgreSQL)          │
│  • usuarios, categorias, transacoes,    │
│    orcamentos, alertas                  │
└─────────────────────────────────────────┘
```

### 📚 Documentação Adicional

- **API Documentation:** Swagger/OpenAPI
- **Entity Diagram:** DER.puml
- **Fluxo Operações:** fluxo-operacoes.puml
- **Padrões:** MVC, Repository, Service Locator

---

## 2.8 Demais Artefatos de Engenharia de Software

### 📝 Documentos Esperados

#### 2.8.1 Especificação Técnica
- [ ] Descrição geral do sistema
- [ ] Escopo (in/out)
- [ ] Constraints técnicos
- [ ] Tecnologias stack (C#, MySQL, HTML5, etc)

#### 2.8.2 Plano de Testes
- [ ] Testes unitários (Controllers, Services)
- [ ] Testes de integração (API)
- [ ] Testes de aceitação (E2E)
- [ ] Coverage mínimo: 70%

#### 2.8.3 Plano de Risco
- [ ] Riscos identificados
- [ ] Probabilidade e impacto
- [ ] Estratégias de mitigação
- [ ] Responsáveis

#### 2.8.4 Cronograma (Gantt)
- [ ] Fases e marcos
- [ ] Sprint timeline
- [ ] Dependências
- [ ] Buffer de contingência

#### 2.8.5 Termo de Abertura do Projeto
- [ ] Objetivo claro
- [ ] Stakeholders
- [ ] Equipe designada
- [ ] Aprovações

#### 2.8.6 Plano de Comunicação
- [ ] Reuniões semanais (segunda 10h)
- [ ] Daily async (Slack)
- [ ] Relatório de status
- [ ] Escalação de problemas

#### 2.8.7 Matriz de Rastreabilidade
- [ ] Requisitos ↔ Use Cases
- [ ] Use Cases ↔ Testes
- [ ] Testes ↔ Requisitos

#### 2.8.8 Glossário de Termos
- [ ] Transação = Gasto realizado
- [ ] Orçamento = Limite mensal
- [ ] Alerta = Notificação automática
- [ ] etc

#### 2.8.9 Documentação de Decisões (ADR)
- [ ] Por que SQL vs NoSQL
- [ ] Por que JWT vs Session
- [ ] Por que C# vs Python
- [ ] Por que MySQL específico

---

# ✅ CHECKLIST DE ENTREGA

## Fase de Desenvolvimento

### Frontend ✓
- [ ] `tela-login.html` — Pronto (HTML/CSS)
- [ ] `tela-dashboard.html` — Pronto (HTML/CSS)
- [ ] `tela-gastos.html` — Pronto (HTML/CSS)
- [ ] `tela-relatorios.html` — Pronto (HTML/CSS)
- [ ] JavaScript — Validações, AJAX, paginação
- [ ] Responsividade — Testes em 320px, 768px, 1024px
- [ ] Design System — Paleta, tipografia aplicados
- [ ] Acessibilidade — Alt texts, ARIA labels

### Backend
- [ ] Projeto ASP.NET Core criado
- [ ] Controllers (7): Auth, Usuario, Transacao, Categoria, Orcamento, Relatorio, Alerta
- [ ] Services (5): Auth, Transacao, Orcamento, Relatorio, Alerta
- [ ] Repositories (5): Usuario, Transacao, Categoria, Orcamento, Alerta
- [ ] DTOs/Models — Request/Response padronizados
- [ ] Autenticação JWT implementada
- [ ] Validações de entrada
- [ ] Error handling centralizado
- [ ] Logging estruturado

### Banco de Dados
- [ ] Schema SQL criado (`schema.sql`)
- [ ] 5 tabelas com constraints
- [ ] Índices otimizados
- [ ] Seed data (categorias)
- [ ] Foreign keys configuradas
- [ ] Connection string em produção

### Integração
- [ ] Frontend ↔ Backend conectado
- [ ] Todos endpoints testados
- [ ] Paginação sincronizada
- [ ] Filtros end-to-end
- [ ] Tratamento de erros

---

## Fase de Documentação

### Documentação Técnica
- [ ] ROADMAP.MD — Fases, RF, RNF, Backlog
- [ ] Especificação Técnica — Stack, constraints
- [ ] Regras de Negócio (RN) — 8 regras documentadas
- [ ] MER — Texto e diagrama
- [ ] DER — PlantUML visual
- [ ] Schema SQL — Script completo
- [ ] Arquitetura — Diagrama de camadas

### Diagramas UML
- [ ] `der-diagram.puml` — Entidade-Relacionamento
- [ ] `arquitetura-sistema.puml` — Componentes
- [ ] `modelo-relacional.puml` — Classes
- [ ] `fluxo-operacoes.puml` — Sequências
- [ ] Todos com README.md

### Artefatos de Engenharia
- [ ] Termo de Abertura
- [ ] Plano de Testes
- [ ] Plano de Risco
- [ ] Cronograma/Gantt
- [ ] Plano de Comunicação
- [ ] Matriz de Rastreabilidade
- [ ] Glossário
- [ ] ADRs (Decisões)

### Documentação de Código
- [ ] README.md — Como rodar projeto
- [ ] API Documentation — Swagger/OpenAPI
- [ ] Comentários em métodos críticos
- [ ] Examples de requisições
- [ ] Variables de ambiente documentadas

---

## Fase de Qualidade

### Testes
- [ ] Testes unitários (Controllers)
- [ ] Testes de integração (Repositories)
- [ ] Testes de API (E2E)
- [ ] Coverage > 70%
- [ ] Testes passando 100%

### Code Review
- [ ] Código segue padrões
- [ ] Sem código duplicado
- [ ] Performance aceitável
- [ ] Documentação completa
- [ ] Sem warnings/errors

---

# 📂 ESTRUTURA DE ARQUIVOS

```
PIM-III/
├── backend/
│   ├── ConektaAPI.sln
│   ├── ConektaAPI/
│   │   ├── Controllers/
│   │   │   ├── AuthController.cs
│   │   │   ├── TransacaoController.cs
│   │   │   ├── CategoriaController.cs
│   │   │   ├── OrcamentoController.cs
│   │   │   ├── AlertaController.cs
│   │   │   └── RelatorioController.cs
│   │   ├── Services/
│   │   │   ├── AuthService.cs
│   │   │   ├── TransacaoService.cs
│   │   │   ├── OrcamentoService.cs
│   │   │   ├── RelatorioService.cs
│   │   │   └── AlertaService.cs
│   │   ├── Data/
│   │   │   ├── Repositories/
│   │   │   │   ├── UsuarioRepository.cs
│   │   │   │   ├── TransacaoRepository.cs
│   │   │   │   ├── CategoriaRepository.cs
│   │   │   │   ├── OrcamentoRepository.cs
│   │   │   │   └── AlertaRepository.cs
│   │   │   └── AppDbContext.cs
│   │   ├── Models/
│   │   │   ├── Usuario.cs
│   │   │   ├── Transacao.cs
│   │   │   ├── Categoria.cs
│   │   │   ├── Orcamento.cs
│   │   │   └── Alerta.cs
│   │   ├── DTOs/
│   │   │   ├── LoginRequest.cs
│   │   │   ├── TransacaoDTO.cs
│   │   │   ├── OrcamentoDTO.cs
│   │   │   └── DashboardKPIs.cs
│   │   ├── appsettings.json
│   │   ├── appsettings.Development.json
│   │   ├── Startup.cs
│   │   └── Program.cs
│   ├── ConektaAPI.Tests/
│   │   ├── Controllers/
│   │   ├── Services/
│   │   └── Repositories/
│   └── README.md
│
├── frontend/
│   ├── tela-login.html
│   ├── tela-dashboard.html
│   ├── tela-gastos.html
│   ├── tela-relatorios.html
│   ├── css/
│   │   └── styles.css (se separado)
│   ├── js/
│   │   ├── app.js
│   │   ├── auth.js
│   │   └── api.js
│   └── README.md
│
├── docs/
│   ├── ROADMAP.MD ✅
│   ├── ESPECIFICACAO_TECNICA.md
│   ├── REGRAS_NEGOCIO.md
│   ├── TERMO_ABERTURA.md
│   ├── PLANO_TESTES.md
│   ├── PLANO_RISCO.md
│   ├── GLOSSARIO.md
│   ├── ARQUITETURA.md
│   ├── scripts/
│   │   └── schema.sql
│   ├── diagramas/ ✅
│   │   ├── der-diagram.puml
│   │   ├── arquitetura-sistema.puml
│   │   ├── modelo-relacional.puml
│   │   ├── fluxo-operacoes.puml
│   │   └── README.md
│   └── Manual_PIM_III.pdf
│
├── .git/
├── .gitignore
└── README.md (raiz)
```

---

## 📞 Contato e Escalação

**Tech Lead:** [nome]  
**Email:** [email]  
**Canal Slack:** #pim-iii-conekta

**Problemas/Dúvidas:**
1. Tente buscar no Glossário
2. Consulte ROADMAP.MD
3. Abra issue no GitHub
4. Escale para Tech Lead

---

**Data de Criação:** 07/05/2026  
**Última Atualização:** 07/05/2026  
**Versão:** 1.0  
**Status:** Em Desenvolvimento ⏳
