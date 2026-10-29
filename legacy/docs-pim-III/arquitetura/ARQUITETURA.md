# 🏗️ Arquitetura do Sistema — PIM III · Conekta

> **Stack definitiva:** React 19 + Vite · ASP.NET Core (.NET 10) · SQLite · Docker Compose  
> **Versão:** 1.0.0 — Final  
> **Data:** Junho / 2026

---

## 🎯 Decisões Técnicas

| Aspecto | Escolha | Motivo |
|---------|---------|--------|
| Framework Frontend | **React 19 + Vite 5** | Componentização, reatividade, build otimizado |
| Gráficos | **Recharts 3** | Integração nativa com React, sem dependências extras |
| Roteamento | **React Router DOM 7** | SPA com rotas protegidas |
| Framework Backend | **ASP.NET Core (.NET 10)** | LTS, Controllers REST, Swagger automático |
| Banco de Dados | **SQLite** | Zero configuração, arquivo único, portável |
| ORM | **Entity Framework Core 10** | Migrations automáticas, LINQ, tipagem forte |
| Autenticação | **JWT + BCrypt** | Stateless, seguro, padrão de mercado |
| Validação | **FluentValidation 11** | Regras expressivas e testáveis |
| Testes Unitários | **xUnit + Moq** | Padrão consolidado .NET |
| Testes E2E | **Playwright + TypeScript** | Multi-browser, CI/CD ready |
| Infraestrutura | **Docker Compose + Nginx** | Deploy reproduzível frontend + backend |

---

## 🏛️ Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│              CLIENTE (Navegador Web)                        │
│                                                             │
│  React 19 + Vite · React Router DOM 7 · Recharts 3         │
│  src/pages/ · src/components/ · src/services/api.js        │
│  Servido por: Nginx (porta 80) via Docker                  │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP/REST · JSON · Bearer JWT
┌───────────────────────▼─────────────────────────────────────┐
│              BACKEND (ASP.NET Core .NET 10)                 │
│                                                             │
│  Controllers → Services → Repositories → EF Core           │
│  JWT Auth · FluentValidation · Serilog · Swagger           │
│  Porta: 5000 (HTTP) · 7001 (HTTPS dev)                    │
└───────────────────────┬─────────────────────────────────────┘
                        │ EF Core 10 · SQLite
┌───────────────────────▼─────────────────────────────────────┐
│                  SQLite — financeiro.db                     │
│                                                             │
│  User · Category · Expense · Income · Budget · Alert       │
│  ChatMessage · Migrations · SeedData (automático)          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura Real de Pastas

### Frontend (`frontend/`)

```
frontend/
├── Dockerfile                    # Nginx container (produção)
├── nginx.conf                    # Configuração Nginx
├── vite.config.js                # Proxy /api → backend:5000
├── package.json                  # React 19, Recharts 3, React Router 7
├── index.html                    # Ponto de entrada SPA
├── design-system.md              # Design System documentado
├── personas.md                   # 3 personas (Marco, Júlia, Pedro)
└── src/
    ├── main.jsx                  # ReactDOM.createRoot + BrowserRouter
    ├── App.jsx                   # Rotas protegidas + ToastContext
    ├── context/
    │   └── ToastContext.jsx      # Notificações globais (sucesso/erro)
    ├── services/
    │   └── api.js                # Fetch wrapper · Base URL · JWT header
    ├── components/
    │   ├── layout/
    │   │   └── Layout.jsx        # Sidebar + Header + área de conteúdo
    │   └── ui/
    │       ├── Button.jsx
    │       ├── Card.jsx
    │       ├── Input.jsx
    │       └── Badge.jsx
    └── pages/
        ├── Login.jsx             # Autenticação + mensagem de erro
        ├── Dashboard.jsx         # KPIs + Recharts + tabela transações
        ├── Gastos.jsx            # CRUD despesas + modal
        ├── Categorias.jsx        # CRUD categorias + modal
        ├── Relatorios.jsx        # Gráficos + filtros por período
        ├── Alertas.jsx           # Lista de alertas + marcar lido
        └── Insights.jsx          # Recomendações de economia (IA simulada)
```

### Backend (`backend/`)

```
backend/
├── Dockerfile                         # Container .NET 10
├── PIM-III-Backend.csproj             # .NET 10 · pacotes NuGet
├── Program.cs                         # DI · Migrations · Seed · CORS · JWT
├── appsettings.json                   # ConnectionString · JwtSettings
├── appsettings.Development.json
├── financeiro.db                      # SQLite (gerado automaticamente)
│
├── Controllers/                       # 🌐 Endpoints REST
│   ├── AuthController.cs              # POST /auth/login · /auth/register
│   ├── ExpensesController.cs          # CRUD /expenses
│   ├── CategoriesController.cs        # CRUD /categories
│   ├── IncomesController.cs           # CRUD /incomes
│   ├── ReportsController.cs           # GET /reports/summary · /by-category · /trend
│   ├── AlertsController.cs            # GET/PUT/DELETE /alerts
│   ├── InsightsController.cs          # GET /insights
│   ├── ChatController.cs              # POST /chat (integração n8n/Telegram)
│   └── IntegrationController.cs       # Webhooks externos
│
├── Application/
│   ├── Services/
│   │   ├── AuthService.cs             # Login · Register · JWT
│   │   ├── ExpenseService.cs          # CRUD despesas · filtros
│   │   ├── IncomeService.cs           # CRUD receitas
│   │   ├── ReportService.cs           # KPIs · tendências · categorias
│   │   ├── AlertService.cs            # Gatilho 80%/100% do orçamento
│   │   ├── InsightService.cs          # IA simulada · recomendações
│   │   ├── ChatService.cs             # Processamento mensagens (n8n)
│   │   ├── IAuthService.cs
│   │   ├── IServices.cs
│   │   └── IAdditionalServices.cs
│   ├── Dtos/                          # Request/Response DTOs
│   └── Validators/                    # FluentValidation rules
│
├── Domain/
│   ├── Entities/
│   │   ├── User.cs
│   │   ├── Expense.cs
│   │   ├── Income.cs
│   │   ├── Category.cs
│   │   ├── Budget.cs
│   │   ├── Alert.cs
│   │   └── ChatMessage.cs
│   ├── Enums/                         # AlertType · ExpenseStatus
│   └── Interfaces/                    # Contratos de repositório
│
├── Infrastructure/
│   └── Persistence/
│       ├── AppDbContext.cs            # UseSqlite() · 7 DbSets
│       ├── SeedData.cs                # Categorias padrão + usuário de teste
│       ├── Configurations/            # IEntityTypeConfiguration por entidade
│       ├── Repositories/              # BaseRepository · CRUD genérico
│       └── Migrations/                # EF Core migrations
│
└── tests/
    ├── PIM-III-Backend.Tests.csproj
    ├── Unit/
    │   └── Services/
    │       ├── ExpenseServiceTests.cs
    │       └── ReportServiceTests.cs
    └── e2e-tests/                     # Playwright E2E
        ├── playwright.config.ts
        ├── package.json
        ├── README.md
        ├── EXECUTION_GUIDE.md
        ├── MANUAL_TESTING_CHECKLIST.md
        ├── BUG_REPORT_TEMPLATE.md
        ├── PERFORMANCE_SECURITY_VALIDATION.md
        └── specs/
            ├── 01-auth.spec.ts        # 4 cenários
            ├── 02-expenses.spec.ts    # 5 cenários
            ├── 03-categories.spec.ts  # 4 cenários
            ├── 04-reports-alerts.spec.ts # 6 cenários
            └── 05-complete-flow.spec.ts  # 2 cenários
```

### Raiz do Projeto

```
PIM-III/
├── docker-compose.yml             # Orquestra frontend (Nginx) + backend (.NET)
├── README.md                      # Guia de instalação e execução
├── LEIA-ME.md                     # Versão em português do README
├── CHANGELOG.md                   # Histórico de versões
├── PIM-III.sln                    # Solution file .NET
└── docs/
    ├── SPRINT.md                  # Planejamento unificado de sprints
    ├── arquitetura/
    │   ├── ARQUITETURA.md         # Este documento
    │   └── INTEGRACAO_DISCIPLINAS_ABNT.md
    ├── diagramas/
    │   ├── arquitetura-sistema.puml
    │   └── modelo-relacional.puml
    ├── planejamento/
    │   └── ROADMAP.MD
    └── tasks/
        ├── TASKS.md
        ├── TASK-016-PROGRESS.md
        └── TASK-016-IMPLEMENTATION-SUMMARY.md
```

---

## 🔧 Stack Tecnológico Completo

### Frontend

| Tecnologia | Versão | Papel |
|-----------|--------|-------|
| React | 19.2.6 | Framework UI |
| React Router DOM | 7.16.0 | Roteamento SPA |
| Recharts | 3.8.1 | Gráficos (linha, barra, pizza) |
| Vite | 5.2.0 | Build tool + dev server |
| CSS3 (Vanilla) | — | Design System com variáveis |
| Nginx | latest | Servidor web em produção |

### Backend

| Tecnologia | Versão | Papel |
|-----------|--------|-------|
| .NET | 10.0 | Runtime e framework |
| ASP.NET Core | 10.0 | Web API (Controllers) |
| Entity Framework Core | 10.0.7 | ORM + Migrations |
| SQLite | embarcado | Banco de dados |
| JWT Bearer | 10.0.7 | Autenticação stateless |
| BCrypt.Net-Next | 4.1.0 | Hash de senhas |
| FluentValidation | 11.3.1 | Validação de domínio |
| Serilog | 10.0.0 | Logging estruturado |
| Swashbuckle (Swagger) | 10.1.7 | Documentação de API |
| CsvHelper | 33.1.0 | Exportação de dados |
| xUnit + Moq | latest | Testes unitários |
| Playwright | 1.40.0 | Testes E2E |

---

## ⚙️ Configuração

### appsettings.json
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=financeiro.db"
  },
  "JwtSettings": {
    "Secret": "pim-iii-chave-secreta-minimo-32-caracteres-aqui",
    "Issuer": "pim-iii-api",
    "Audience": "pim-iii-web",
    "ExpirationMinutes": 60,
    "RefreshTokenExpirationDays": 7
  },
  "AllowedHosts": "*"
}
```

### vite.config.js (proxy de desenvolvimento)
```js
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

### docker-compose.yml (resumo)
```yaml
services:
  backend:
    build: ./backend
    ports: ["5000:80"]
    volumes: ["./data:/app/data"]   # SQLite persistido

  frontend:
    build: ./frontend
    ports: ["80:80"]
    depends_on: [backend]
```

---

## 🗺️ Endpoints da API

| Método | Rota | Descrição | Auth |
|--------|------|-----------|:----:|
| POST | `/auth/register` | Cadastro de usuário | ❌ |
| POST | `/auth/login` | Login + JWT | ❌ |
| GET | `/expenses` | Listar despesas (filtros: período, categoria) | ✅ |
| GET | `/expenses/:id` | Buscar despesa por ID | ✅ |
| POST | `/expenses` | Criar despesa | ✅ |
| PUT | `/expenses/:id` | Editar despesa | ✅ |
| DELETE | `/expenses/:id` | Deletar despesa | ✅ |
| GET | `/categories` | Listar categorias | ✅ |
| POST | `/categories` | Criar categoria | ✅ |
| PUT | `/categories/:id` | Editar categoria | ✅ |
| DELETE | `/categories/:id` | Deletar categoria | ✅ |
| GET | `/incomes` | Listar receitas | ✅ |
| POST | `/incomes` | Criar receita | ✅ |
| PUT | `/incomes/:id` | Editar receita | ✅ |
| DELETE | `/incomes/:id` | Deletar receita | ✅ |
| GET | `/reports/summary` | KPIs (total, saldo, maior gasto) | ✅ |
| GET | `/reports/by-category` | Gastos por categoria | ✅ |
| GET | `/reports/trend` | Tendência últimos 6 meses | ✅ |
| GET | `/alerts` | Listar alertas | ✅ |
| PUT | `/alerts/:id/read` | Marcar alerta como lido | ✅ |
| DELETE | `/alerts/:id` | Deletar alerta | ✅ |
| GET | `/insights` | Recomendações de economia | ✅ |
| POST | `/chat` | Mensagem via Telegram/n8n | ✅ |

---

## 🔐 Fluxo de Autenticação JWT

```
1. REGISTER  →  POST /auth/register
   ├─ FluentValidation (email único, senha ≥ 6 chars)
   ├─ BCrypt.HashPassword(senha)
   ├─ Persistir User no SQLite
   └─ Retornar JWT

2. LOGIN  →  POST /auth/login
   ├─ Buscar usuário por email
   ├─ BCrypt.Verify(senha, hash)
   ├─ Gerar JWT (Claims: userId, email)
   └─ Retornar { token, user }

3. REQUESTS AUTENTICADOS
   ├─ Header: Authorization: Bearer <JWT>
   ├─ Middleware valida assinatura e expiração
   └─ Extrair UserId → filtrar dados por usuário

4. LOGOUT (cliente)
   └─ Remover token do localStorage → redirecionar para /login
      (HTTP 401 aciona redirect automático via api.js)
```

---

## 🧪 Testes

### Unitários (xUnit + Moq)
```
backend/tests/Unit/Services/
├── ExpenseServiceTests.cs   # CRUD, filtros, validações
└── ReportServiceTests.cs    # KPIs, cálculos de agregação
```

### E2E — Playwright
```
backend/tests/e2e-tests/specs/
├── 01-auth.spec.ts           → 4 cenários (login, register, logout, erro credencial)
├── 02-expenses.spec.ts       → 5 cenários (CRUD completo + filtro)
├── 03-categories.spec.ts     → 4 cenários (CRUD completo)
├── 04-reports-alerts.spec.ts → 6 cenários (KPIs, relatórios, alertas, insights)
└── 05-complete-flow.spec.ts  → 2 cenários (jornada completa do usuário)
                                            Total: 21 cenários
```

**Executar testes E2E:**
```bash
cd backend/tests/e2e-tests
npm install
npx playwright install
npm test                   # headless
npm run test:headed        # com browser visível
npm run report             # relatório HTML
```

**Credenciais de teste:** `test@example.com` / `Test@12345`  
**Browsers:** Chromium, Firefox, WebKit + Mobile (Pixel 5, iPhone 12)

---

## 🚀 Como Executar

### Com Docker (produção)
```bash
docker-compose up --build
# Frontend: http://localhost
# Backend API: http://localhost:5000
# Swagger: http://localhost:5000/swagger
```

### Em desenvolvimento
```bash
# Backend
cd backend
dotnet run
# API disponível em http://localhost:5000

# Frontend
cd frontend
npm install
npm run dev
# App disponível em http://localhost:5173
```

---

> **Banco de dados:** O arquivo `financeiro.db` é gerado automaticamente na primeira execução.
> Migrations e seed (categorias padrão + usuário de teste) são aplicados automaticamente no startup via `Program.cs`.
