# 📁 Estrutura de Pastas — PIM III

> **Legenda:**  ✅ já existe  |  🔨 criar agora (Sprint atual)  |  📋 criar depois

---

## 🌳 Visão Geral

```
PIM-III/
│
├── 📄 CHANGELOG.md                     ✅
├── 📄 LEIA-ME.md                       ✅
├── 📄 .gitignore                       ✅
│
├── 📁 .project/                        ✅  Configurações internas do projeto
│   ├── git_skill.md
│   ├── instructions.md
│   └── update-tasks-skill.md
│
├── 📁 frontend/                        ✅  Interface Web (HTML/CSS/JS Vanilla)
│
├── 📁 backend/                         🔨  API REST (ASP.NET Core 8)
│
└── 📁 docs/                            ✅  Documentação do projeto
```

---

## 🎨 Frontend — Estrutura Detalhada

> Vanilla HTML + CSS + JavaScript. Sem bundler, sem framework.  
> Organizado em camadas: **páginas → estilos → scripts → assets**.

```
frontend/
│
├── 📄 tela-login.html                  ✅
├── 📄 tela-cadastro.html               ✅
├── 📄 tela-dashboard.html              ✅
├── 📄 tela-gastos.html                 ✅
├── 📄 tela-relatorios.html             ✅
├── 📄 tela-categorias.html             🔨  TASK-007.2
├── 📄 tela-alertas.html                🔨  TASK-008.1
├── 📄 tela-insights.html               🔨  TASK-008.2
│
├── 📁 css/
│   ├── variables.css                   🔨  Tokens do Design System (cores, fontes, espaçamentos)
│   ├── base.css                        🔨  Reset + estilos globais
│   ├── components.css                  🔨  Button, Input, Card, Modal, Toast, Badge
│   ├── layout.css                      🔨  Sidebar, topbar, grid de conteúdo
│   └── utilities.css                   🔨  Classes utilitárias (hidden, flex, gap, etc.)
│
├── 📁 js/
│   │
│   ├── 📁 core/                        🔨  Base — carregado em todas as páginas
│   │   ├── api.js                      🔨  Cliente HTTP (fetch + headers + tratamento de erro)
│   │   ├── auth.js                     🔨  Login, logout, JWT no localStorage, guards
│   │   └── utils.js                    🔨  Formatadores (moeda, data), helpers gerais
│   │
│   ├── 📁 components/                  🔨  Componentes JS reutilizáveis
│   │   ├── modal.js                    🔨  Abrir/fechar modal, focus trap, escape key
│   │   ├── toast.js                    🔨  Notificações de sucesso/erro
│   │   ├── sidebar.js                  🔨  Toggle sidebar mobile
│   │   └── confirm-dialog.js           🔨  Modal de confirmação (delete)
│   │
│   └── 📁 pages/                       🔨  Lógica específica de cada tela
│       ├── login.js                    🔨  TASK-009.2
│       ├── cadastro.js                 🔨  TASK-009.2
│       ├── dashboard.js                🔨  TASK-009.5
│       ├── gastos.js                   🔨  TASK-009.3
│       ├── categorias.js               🔨  TASK-009.4
│       ├── relatorios.js               🔨  TASK-009.5
│       ├── alertas.js                  🔨  TASK-009.5
│       └── insights.js                 🔨  TASK-009.5
│
└── 📁 assets/
    ├── 📁 icons/                       🔨  SVGs do Design System
    ├── 📁 fonts/                       📋  DM Sans + DM Serif (auto-hospedar se necessário)
    └── 📁 images/                      📋  Logos, ilustrações
```

---

## ⚙️ Backend — Estrutura Detalhada

> ASP.NET Core 8 · Controllers · SQLite · Arquitetura em Camadas  
> A pasta `backend/` **é** a raiz do projeto .NET.

```
backend/
│
├── 📁 Controllers/                     🔨  TASK-010 + 011 + 012  Endpoints REST
│   ├── AuthController.cs               🔨  POST /auth/register, /auth/login, /auth/refresh
│   ├── ExpensesController.cs           🔨  GET/POST/PUT/DELETE /expenses
│   ├── CategoriesController.cs         🔨  GET/POST/PUT/DELETE /categories
│   ├── ReportsController.cs            📋  GET /reports/summary, /reports/by-category
│   ├── AlertsController.cs             📋  GET/PUT/DELETE /alerts
│   └── InsightsController.cs           📋  GET /insights
│
├── 📁 Application/                     🔨  Lógica de negócio e orquestração
│   │
│   ├── 📁 Services/
│   │   ├── AuthService.cs              🔨
│   │   ├── ExpenseService.cs           🔨
│   │   ├── CategoryService.cs          🔨
│   │   ├── ReportService.cs            📋
│   │   ├── AlertService.cs             📋
│   │   └── InsightService.cs           📋
│   │
│   ├── 📁 Dtos/                        🔨  Objetos de entrada e saída da API
│   │   ├── 📁 Auth/
│   │   │   ├── LoginRequest.cs
│   │   │   ├── RegisterRequest.cs
│   │   │   └── AuthResponse.cs
│   │   ├── 📁 Expenses/
│   │   │   ├── CreateExpenseRequest.cs
│   │   │   ├── UpdateExpenseRequest.cs
│   │   │   └── ExpenseResponse.cs
│   │   ├── 📁 Categories/
│   │   │   ├── CreateCategoryRequest.cs
│   │   │   ├── UpdateCategoryRequest.cs
│   │   │   └── CategoryResponse.cs
│   │   └── 📁 Reports/
│   │       ├── ReportSummaryResponse.cs
│   │       └── CategoryReportResponse.cs
│   │
│   └── 📁 Validators/                  🔨  FluentValidation — regras de validação
│       ├── LoginRequestValidator.cs
│       ├── RegisterRequestValidator.cs
│       ├── CreateExpenseValidator.cs
│       └── CreateCategoryValidator.cs
│
├── 📁 Domain/                          🔨  Entidades e contratos (sem dependências externas)
│   │
│   ├── 📁 Entities/
│   │   ├── User.cs
│   │   ├── Expense.cs
│   │   ├── Category.cs
│   │   ├── Budget.cs
│   │   └── Alert.cs
│   │
│   ├── 📁 Enums/
│   │   ├── AlertType.cs               # OrcamentoExcedido | GastoAlto | CategoriaLimite
│   │   └── ExpenseStatus.cs           # Ativo | Cancelado
│   │
│   └── 📁 Interfaces/
│       ├── IExpenseRepository.cs
│       ├── ICategoryRepository.cs
│       ├── IUserRepository.cs
│       └── IAuthService.cs
│
├── 📁 Infrastructure/                  🔨  Persistência e segurança
│   │
│   ├── 📁 Persistence/
│   │   ├── AppDbContext.cs             🔨  DbContext com UseSqlite()
│   │   ├── 📁 Configurations/          🔨  IEntityTypeConfiguration por entidade
│   │   │   ├── UserConfiguration.cs
│   │   │   ├── ExpenseConfiguration.cs
│   │   │   └── CategoryConfiguration.cs
│   │   ├── 📁 Repositories/
│   │   │   ├── BaseRepository.cs       🔨  CRUD genérico
│   │   │   ├── ExpenseRepository.cs
│   │   │   ├── CategoryRepository.cs
│   │   │   └── UserRepository.cs
│   │   └── 📁 Migrations/             🔨  Gerado por: dotnet ef migrations add InitialCreate
│   │
│   └── 📁 Security/
│       ├── JwtTokenService.cs          🔨  Geração e validação de JWT
│       └── PasswordHasher.cs           🔨  BCrypt wrapper
│
├── 📁 Common/                          🔨  Utilitários compartilhados
│   ├── 📁 Exceptions/
│   │   ├── NotFoundException.cs
│   │   ├── UnauthorizedException.cs
│   │   └── ValidationException.cs
│   ├── 📁 Middleware/
│   │   └── ExceptionHandlingMiddleware.cs   # Erros → JSON padronizado
│   └── 📁 Constants/
│       ├── AppConstants.cs
│       └── ValidationMessages.cs
│
├── 📁 tests/                           📋  TASK-013  Projeto de Testes
│   ├── 📁 Unit/
│   │   ├── 📁 Services/
│   │   │   ├── AuthServiceTests.cs
│   │   │   └── ExpenseServiceTests.cs
│   │   └── 📁 Validators/
│   │       └── CreateExpenseValidatorTests.cs
│   ├── 📁 Integration/
│   │   └── ExpensesControllerTests.cs
│   └── 📁 Fixtures/
│       └── TestData.cs
│
├── 📁 Properties/
│   └── launchSettings.json             🔨  https: 7001 | http: 5001
│
├── 📄 financeiro.db                    🔨  Gerado automaticamente na 1ª execução
├── 📄 appsettings.json                 🔨
├── 📄 appsettings.Production.json      📋
├── 📄 Program.cs                       🔨  Entry point + DI container
├── 📄 PIM-III-Backend.csproj           🔨  Gerado pelo dotnet new
└── 📄 README.md                        📋  TASK-018
```

---

## 📚 Docs — Estrutura Detalhada

```
docs/
│
├── 📁 arquitetura/
│   └── ARQUITETURA.md                  ✅  Decisões técnicas do backend
│
├── 📁 diagramas/
│   ├── README.md                       ✅
│   ├── der-diagram.puml                ✅  Diagrama Entidade-Relacionamento
│   ├── arquitetura-sistema.puml        ✅  Visão geral da arquitetura
│   ├── fluxo-operacoes.puml            ✅  Fluxo de operações
│   └── modelo-relacional.puml          ✅  Modelo relacional lógico
│
├── 📁 planejamento/
│   ├── ROADMAP.MD                      ✅  Cronograma de fases e sprints
│   ├── ESCOPO_DOCUMENTACAO.md          ✅
│   └── Manual_PIM_III - ADS.pdf        ✅  Manual original do PIM
│
└── 📁 tasks/
    └── TASKS.md                        ✅  Backlog completo das tarefas
```

---

## 🚀 Comandos para Criar a Estrutura do Backend

```bash
# 1. Criar o projeto .NET na pasta backend/
dotnet new web -n PIM-III-Backend --output backend/

# 2. Criar estrutura de pastas (rodar na raiz do projeto)
mkdir backend/Controllers
mkdir backend/Application/Services
mkdir backend/Application/Dtos/Auth
mkdir backend/Application/Dtos/Expenses
mkdir backend/Application/Dtos/Categories
mkdir backend/Application/Dtos/Reports
mkdir backend/Application/Validators
mkdir backend/Domain/Entities
mkdir backend/Domain/Enums
mkdir backend/Domain/Interfaces
mkdir backend/Infrastructure/Persistence/Configurations
mkdir backend/Infrastructure/Persistence/Repositories
mkdir backend/Infrastructure/Security
mkdir backend/Common/Exceptions
mkdir backend/Common/Middleware
mkdir backend/Common/Constants
mkdir backend/tests/Unit/Services
mkdir backend/tests/Unit/Validators
mkdir backend/tests/Integration
mkdir backend/tests/Fixtures

# 3. Instalar pacotes NuGet principais
cd backend
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
dotnet add package Microsoft.EntityFrameworkCore.Tools
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package BCrypt.Net-Next
dotnet add package FluentValidation.AspNetCore
dotnet add package Swashbuckle.AspNetCore
dotnet add package Serilog.AspNetCore
```

---

## 📌 Ordem de Criação Recomendada

```
1️⃣  backend/           → dotnet new + pacotes NuGet          (hoje)
2️⃣  Domain/Entities    → User, Expense, Category, Budget, Alert
3️⃣  Infrastructure/    → AppDbContext + Configurations
4️⃣  dotnet ef migrations add InitialCreate
5️⃣  Infrastructure/Security → JwtTokenService + PasswordHasher
6️⃣  Application/       → DTOs + Validators + Services
7️⃣  Controllers/       → Auth, Expenses, Categories
8️⃣  frontend/css/      → variables.css (extrair do design system)
9️⃣  frontend/js/core/  → api.js + auth.js + utils.js
🔟  frontend/js/pages/  → integrar tela a tela (login primeiro)
```
