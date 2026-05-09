# 🏗️ TASK-010: Arquitetura do Backend — PIM III

> **Decisão final:** ASP.NET Core 8 com **Controllers** + **SQLite** + Arquitetura em Camadas.

---

## 🎯 DECISÕES TÉCNICAS

| Aspecto | Escolha | Motivo |
|---------|---------|--------|
| Padrão de API | **ASP.NET Core Controllers** | Escalável, testável, Swagger automático |
| Banco de Dados | **SQLite** | Zero configuração, arquivo único `.db`, portável |
| ORM | **Entity Framework Core 8** | Migrations automáticas, LINQ, tipagem forte |
| Autenticação | **JWT + BCrypt** | Stateless, seguro, padrão de mercado |
| Validação | **FluentValidation** | Regras expressivas e testáveis |
| Testes | **xUnit + Moq** | Padrão consolidado .NET |

---

## 📁 ESTRUTURA DE PASTAS

> A pasta `backend/` **é** a raiz do projeto .NET.

```
backend/                           # Raiz do projeto .NET
├── .vscode/
│   └── settings.json              # Configurações VSCode (debug, formatação)
├── Properties/
│   └── launchSettings.json        # Portas de execução (https: 7001, http: 5001)
│
├── Controllers/                   # 🌐 Camada de API — Controllers REST
│   ├── AuthController.cs          # POST /auth/login, /auth/register, /auth/refresh
│   ├── ExpensesController.cs      # GET/POST/PUT/DELETE /expenses
│   ├── CategoriesController.cs    # GET/POST/PUT/DELETE /categories
│   ├── ReportsController.cs       # GET /reports/summary, /reports/by-category
│   ├── AlertsController.cs        # GET/PUT/DELETE /alerts
│   └── InsightsController.cs      # GET /insights
│
├── Application/                   # 🧠 Camada de Aplicação — Lógica e orquestração
│   ├── Services/
│   │   ├── AuthService.cs
│   │   ├── ExpenseService.cs
│   │   ├── CategoryService.cs
│   │   ├── ReportService.cs
│   │   ├── AlertService.cs
│   │   └── InsightService.cs
│   │
│   ├── Dtos/                      # Data Transfer Objects (Request/Response)
│   │   ├── Auth/
│   │   │   ├── LoginRequest.cs
│   │   │   ├── RegisterRequest.cs
│   │   │   └── AuthResponse.cs
│   │   ├── Expenses/
│   │   │   ├── CreateExpenseRequest.cs
│   │   │   ├── UpdateExpenseRequest.cs
│   │   │   └── ExpenseResponse.cs
│   │   ├── Categories/
│   │   │   ├── CreateCategoryRequest.cs
│   │   │   ├── UpdateCategoryRequest.cs
│   │   │   └── CategoryResponse.cs
│   │   └── Reports/
│   │       ├── ReportSummaryResponse.cs
│   │       └── CategoryReportResponse.cs
│   │
│   └── Validators/                # FluentValidation — regras de validação
│       ├── LoginRequestValidator.cs
│       ├── RegisterRequestValidator.cs
│       ├── CreateExpenseValidator.cs
│       └── CreateCategoryValidator.cs
│
├── Domain/                        # 🏛️ Camada de Domínio — Entidades e contratos
│   ├── Entities/
│   │   ├── User.cs
│   │   ├── Expense.cs
│   │   ├── Category.cs
│   │   ├── Budget.cs
│   │   └── Alert.cs
│   │
│   ├── Enums/
│   │   ├── AlertType.cs           # OrcamentoExcedido, GastoAlto, CategoriaLimite
│   │   └── ExpenseStatus.cs       # Ativo, Cancelado
│   │
│   └── Interfaces/
│       ├── IExpenseRepository.cs
│       ├── ICategoryRepository.cs
│       ├── IUserRepository.cs
│       └── IAuthService.cs
│
├── Infrastructure/                # 🔧 Camada de Infraestrutura — Persistência
│   ├── Persistence/
│   │   ├── AppDbContext.cs        # DbContext com UseSqlite()
│   │   ├── Configurations/        # IEntityTypeConfiguration por entidade
│   │   │   ├── UserConfiguration.cs
│   │   │   ├── ExpenseConfiguration.cs
│   │   │   └── CategoryConfiguration.cs
│   │   ├── Repositories/
│   │   │   ├── BaseRepository.cs  # CRUD genérico
│   │   │   ├── ExpenseRepository.cs
│   │   │   ├── CategoryRepository.cs
│   │   │   └── UserRepository.cs
│   │   └── Migrations/            # Geradas por: dotnet ef migrations add
│   │
│   └── Security/
│       ├── JwtTokenService.cs     # Geração e validação de JWT
│       └── PasswordHasher.cs      # BCrypt wrapper
│
├── Common/                        # 🔨 Utilidades compartilhadas
│   ├── Exceptions/
│   │   ├── NotFoundException.cs
│   │   ├── UnauthorizedException.cs
│   │   └── ValidationException.cs
│   ├── Middleware/
│   │   └── ExceptionHandlingMiddleware.cs  # Erros → JSON padronizado
│   └── Constants/
│       ├── AppConstants.cs
│       └── ValidationMessages.cs
│
├── tests/                         # 🧪 Projeto de Testes
│   ├── Unit/
│   │   ├── Services/
│   │   │   ├── AuthServiceTests.cs
│   │   │   └── ExpenseServiceTests.cs
│   │   └── Validators/
│   │       └── CreateExpenseValidatorTests.cs
│   ├── Integration/
│   │   └── ExpensesControllerTests.cs
│   └── Fixtures/
│       └── TestData.cs
│
├── financeiro.db                  # 🗄️ Banco SQLite (gerado na 1ª execução)
├── appsettings.json               # Configuração local
├── appsettings.Production.json    # Configuração produção
├── Program.cs                     # Ponto de entrada e DI
├── PIM-III-Backend.csproj
└── README.md
```

---

## 🔧 STACK TECNOLÓGICO

| Categoria | Tecnologia | Versão |
|-----------|-----------|--------|
| Framework | ASP.NET Core | **8.0 LTS** |
| Linguagem | C# | **12** |
| ORM | Entity Framework Core | **8+** |
| Banco | SQLite | embarcado |
| Auth | JWT Bearer | built-in |
| Hash | BCrypt.Net-Next | latest |
| Validação | FluentValidation | latest |
| Logging | Serilog | latest |
| Testes | xUnit + Moq + FluentAssertions | latest |
| Docs API | Swagger (Swashbuckle) | latest |
| Utilitários | CsvHelper | latest |

---

## 📦 DEPENDÊNCIAS (NuGet Packages)

```bash
# EF Core + SQLite
dotnet add package Microsoft.EntityFrameworkCore
dotnet add package Microsoft.EntityFrameworkCore.Tools
dotnet add package Microsoft.EntityFrameworkCore.Sqlite

# Autenticação
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package BCrypt.Net-Next

# Validação
dotnet add package FluentValidation.AspNetCore

# Logging
dotnet add package Serilog.AspNetCore
dotnet add package Serilog.Sinks.Console
dotnet add package Serilog.Sinks.File

# API Docs
dotnet add package Swashbuckle.AspNetCore

# Utilitários
dotnet add package CsvHelper

# Testes (projeto separado)
dotnet add package xUnit
dotnet add package Moq
dotnet add package FluentAssertions
dotnet add package Microsoft.EntityFrameworkCore.InMemory
```

---

## ⚙️ CONFIGURAÇÃO

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

### Program.cs
```csharp
var builder = WebApplication.CreateBuilder(args);

// Controllers
builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// SQLite + EF Core
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => { /* configurar em JwtTokenService */ });

// CORS (permitir frontend local)
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

// Injeção de Dependência
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IExpenseRepository, ExpenseRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
```

---

## 🔐 FLUXO DE AUTENTICAÇÃO JWT

```
1. REGISTER  →  POST /auth/register
   ├─ Validar email (único no banco)
   ├─ Hash senha com BCrypt
   ├─ Persistir User no SQLite
   └─ Retornar JWT + refresh token

2. LOGIN  →  POST /auth/login
   ├─ Buscar usuário por email
   ├─ Verificar senha com BCrypt.Verify()
   ├─ Gerar JWT (60 min) + refresh token (7 dias)
   └─ Retornar ambos os tokens

3. REQUESTS AUTENTICADOS
   ├─ Header: Authorization: Bearer <JWT>
   ├─ Middleware valida assinatura e expiração
   ├─ Extrair claims (userId, email)
   └─ Injetar no controller via User.Claims

4. REFRESH  →  POST /auth/refresh
   ├─ Validar refresh token no banco
   ├─ Gerar novo JWT
   └─ Retornar novo access token
```

---

## 📝 CHECKLIST DE SETUP

- [ ] `dotnet new web -n PIM-III-Backend --output backend/`
- [ ] Instalar todos os NuGet packages acima
- [ ] Criar estrutura de pastas conforme diagrama
- [ ] Implementar entidades Domain (`User`, `Expense`, `Category`, `Budget`, `Alert`)
- [ ] Criar `AppDbContext` com `UseSqlite()`
- [ ] Configurar `IEntityTypeConfiguration` por entidade
- [ ] `dotnet ef migrations add InitialCreate`
- [ ] `dotnet ef database update`
- [ ] Implementar `JwtTokenService` e `PasswordHasher`
- [ ] Criar `AuthController` + `AuthService`
- [ ] Criar `ExpensesController` + `ExpenseService`
- [ ] Configurar `ExceptionHandlingMiddleware`
- [ ] Testar autenticação com Postman
- [ ] Testar CRUD de gastos com Postman

> **💡 SQLite:** O arquivo `financeiro.db` é gerado automaticamente na raiz do projeto
> na primeira execução. Para entrega/apresentação, basta incluir o `.db` junto com a API.
