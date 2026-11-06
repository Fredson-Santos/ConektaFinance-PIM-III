# Orientação a objetos e SOLID no código

Material de apoio ao capítulo 5 (Etapa 6: Programação Aplicada em .NET). Cada conceito traz um trecho curto do código real, o arquivo de onde ele foi tirado e uma frase pronta para servir de base ao texto. Os trechos podem ser colados no relatório como **Quadro** (fonte Courier ou Consolas 10, espaço simples, com "Fonte: elaborado pelos autores").

Figuras de apoio: `figuras/diagramas/05-diagrama-camadas.png` e `figuras/diagramas/05-diagrama-classes.png`.

---

## 1. Organização em camadas e modularização

| Camada | Pasta | Responsabilidade | Depende de |
| --- | --- | --- | --- |
| Apresentação | `backend/Controllers/` | Recebe as requisições HTTP, aplica `[Authorize]` e devolve as respostas | Application |
| Aplicação | `backend/Application/` | Serviços (regras de negócio), DTOs, validadores (FluentValidation) e middlewares | Domain |
| Domínio | `backend/Domain/` | Entidades, enums, constantes e **interfaces dos repositórios** | nada |
| Infraestrutura | `backend/Infrastructure/` | EF Core e PostgreSQL, repositórios, clientes de IA e WhatsApp, arquivos e health checks | Domain e Application |

O domínio não conhece banco de dados, HTTP nem bibliotecas externas: ele só declara contratos (`IUserRepository`, `ITransactionRepository` etc.), que a infraestrutura implementa. Assim, trocar o SQLite pelo PostgreSQL (F14.4b) exigiu alterar apenas a camada de infraestrutura.

**Módulos funcionais:** autenticação (OTP e JWT), categorias, transações, orçamentos, alertas, dashboard, relatórios, importação de extratos, assistente de IA, canal WhatsApp e administração. Cada um tem o próprio controller, a interface de serviço e a implementação (ex.: `BudgetsController` → `IBudgetService` → `BudgetService` → `IBudgetRepository`).

---

## 2. Abstração

O assistente de IA é usado pelo resto do sistema só por meio de uma interface. Quem chama não sabe se a resposta vem de um modelo de linguagem (LLM) ou de regras locais.

`backend/Application/Services/ICopilotAiClient.cs:50`

```csharp
public interface ICopilotAiClient
{
    Task<CopilotReply> ReplyAsync(CopilotAgentRequest request);

    Task<ReceiptExtract?> ExtractReceiptAsync(string imageBase64);
}
```

O mesmo vale para o envio do código de login:

`backend/Application/Services/IOtpService.cs:11`

```csharp
public interface IOtpSender
{
    Task SendAsync(string phone, string code);
}
```

> **Para o texto:** a abstração isola *o que* o sistema precisa (responder ao usuário, enviar um código) de *como* isso é feito (LLM, regras, WhatsApp ou log de desenvolvimento).

---

## 3. Herança

Todos os controllers herdam de uma classe base **abstrata**, que concentra a rota versionada, a exigência de autenticação e a leitura do usuário logado a partir do token JWT.

`backend/Controllers/BaseApiController.cs:6`

```csharp
[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public abstract class BaseApiController : ControllerBase
{
    protected int CurrentUserId
    {
        get
        {
            var value = User.FindFirst("sub")?.Value
                ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("user_id")?.Value;
            if (!int.TryParse(value, out var id) || id <= 0)
                throw new UnauthorizedAccessException();
            return id;
        }
    }
}
```

Exemplo de subclasse (`backend/Controllers/BudgetsController.cs:12`):

```csharp
public class BudgetsController(IBudgetService budgetService) : BaseApiController
```

Outros usos de herança: os validadores herdam de `AbstractValidator<T>` (`backend/Application/Validators/TransactionValidators.cs:6`), `AppException` herda de `Exception` (`backend/Application/Exceptions/AppException.cs:3`) e `AppDbContext` herda de `DbContext` do Entity Framework.

> **Para o texto:** a herança evita repetir em 12 controllers a mesma rota, a mesma regra de autorização e a mesma leitura do usuário autenticado.

---

## 4. Encapsulamento

`CurrentUserId` é `protected`: só as subclasses o enxergam, e nenhum controller lê o token diretamente. No serviço de OTP, a normalização do telefone e o *hash* do código são métodos `private static`, invisíveis fora da classe:

`backend/Application/Services/OtpService.cs:93` e `:101`

```csharp
private static string NormalizePhone(string phone)
{
    var digits = new string(phone.Where(char.IsDigit).ToArray());
    if (digits.Length is < 10 or > 11)
        throw AppException.BadRequest("Telefone invalido", "Informe o DDD e o numero completo do WhatsApp.");
    return digits;
}

private static string HashCode(string code) =>
    Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(code)));
```

Na exceção de negócio, as propriedades só têm `get`, então não podem ser alteradas depois de criadas, e a construção é feita por métodos de fábrica:

`backend/Application/Exceptions/AppException.cs:3`

```csharp
public class AppException(int statusCode, string title, string detail, IDictionary<string, string[]>? errors = null)
    : Exception(title)
{
    public int StatusCode { get; } = statusCode;
    public string Title { get; } = title;
    public string Detail { get; } = detail;

    public static AppException NotFound(string title, string detail) => new(404, title, detail);
    public static AppException Conflict(string title, string detail) => new(409, title, detail);
}
```

Os controllers recebem e devolvem **DTOs** (`backend/Application/Dtos/`), nunca as entidades do banco: campos internos, como o *hash* da senha do usuário, não saem da API.

> **Limite, para o texto não afirmar além do que existe:** as entidades de domínio (`Domain/Entities/`) são classes de dados com `get; set;` públicos, exigidas pelo mapeamento do EF Core. O encapsulamento das regras fica nos serviços, nos DTOs e nos validadores, não dentro das entidades.

---

## 5. Polimorfismo

Há três implementações de `ICopilotAiClient` (`backend/Infrastructure/Copilot/CopilotClients.cs`):

| Classe | Linha | Comportamento |
| --- | :-: | --- |
| `RuleBasedCopilotClient` | 13 | Responde por regras e palavras-chave, sem acesso à rede |
| `LlmCopilotClient` | 131 | Chama o modelo de linguagem com *function calling* |
| `CompositeCopilotClient` | 514 | Tenta o LLM e, se ele falhar, usa as regras |

`backend/Infrastructure/Copilot/CopilotClients.cs:514`

```csharp
public class CompositeCopilotClient(LlmCopilotClient? llm, RuleBasedCopilotClient ruleBased,
    ILogger<CompositeCopilotClient> logger) : ICopilotAiClient
{
    public async Task<CopilotReply> ReplyAsync(CopilotAgentRequest request)
    {
        if (llm is not null)
        {
            try
            {
                return await llm.ReplyAsync(request);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Cliente de LLM falhou; usando fallback baseado em regras.");
            }
        }
        return await ruleBased.ReplyAsync(request);
    }
}
```

`IOtpSender` tem duas implementações: `EvolutionOtpSender` (envio real pelo WhatsApp, `backend/Infrastructure/Messaging/EvolutionOtpSender.cs:12`) e `DevOtpSender` (código no log, para desenvolvimento e testes, `backend/Infrastructure/Messaging/DevOtpSender.cs:7`). A escolha é feita em tempo de execução (`backend/Program.cs:242`):

```csharp
builder.Services.AddScoped<IOtpSender>(sp =>
{
    var evolution = sp.GetRequiredService<IEvolutionClient>();
    return evolution.IsConfigured
        ? new EvolutionOtpSender(...)
        : new DevOtpSender(...);
});
```

> **Para o texto:** o `OtpService` chama `SendAsync` sem saber qual classe está por trás. O mesmo código envia o código pelo WhatsApp em produção e apenas o registra em log nos testes.

---

## 6. Princípios SOLID

| Princípio | Onde aparece | Evidência |
| --- | --- | --- |
| **S** — Responsabilidade única | Cada serviço cuida de um assunto; o cálculo do status do orçamento fica isolado | `backend/Application/Services/BudgetStatus.cs` (só decide `ok`, `warn`, `over` ou `noLimit`); validação separada em `Application/Validators/` |
| **O** — Aberto/fechado | Um novo provedor de IA ou de envio de mensagens entra como nova classe, sem alterar `CopilotService` nem `OtpService` | `ICopilotAiClient` e `IOtpSender` com várias implementações |
| **L** — Substituição de Liskov | Qualquer implementação de `ICopilotAiClient` pode ocupar o lugar da outra; nos testes, a IA simulada substitui a real | `CompositeCopilotClient` usa `LlmCopilotClient` e `RuleBasedCopilotClient` de forma intercambiável |
| **I** — Segregação de interfaces | Interfaces pequenas e específicas, em vez de um repositório genérico gigante | `IAlertRepository`, `IOtpRepository`, `IMonthlyClosingRepository` (`backend/Domain/Interfaces/ISystemRepositories.cs`); `IOtpService` separado de `IOtpSender` |
| **D** — Inversão de dependência | Controllers e serviços recebem interfaces pelo construtor; o contêiner de injeção de dependência liga cada interface à sua implementação | `backend/Program.cs:186-242` (`AddScoped<IUserRepository, UserRepository>()` etc.) |

Trecho para ilustrar a inversão de dependência (`backend/Program.cs:186`):

```csharp
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ITransactionRepository, TransactionRepository>();
builder.Services.AddScoped<IBudgetService, BudgetService>();
builder.Services.AddScoped<ICopilotService, CopilotService>();
```

---

## 7. Padrões de projeto reconhecíveis

| Padrão | Onde |
| --- | --- |
| Repository | `Domain/Interfaces/` (contratos) e `Infrastructure/Persistence/Repositories/` (implementações) |
| Injeção de dependência | `Program.cs`, construtores primários dos controllers e serviços |
| Composite / Fallback | `CompositeCopilotClient` |
| Strategy | `IOtpSender` (WhatsApp ou log), escolhido pela configuração |
| DTO | `Application/Dtos/` |
| Middleware (cadeia de responsabilidade) | `ErrorHandlingMiddleware`, `CorrelationIdMiddleware`, `SecurityHeadersMiddleware` em `Application/Middleware/` |
| Factory Method | `AppException.NotFound(...)`, `AppException.Conflict(...)` |

Referências sugeridas para este capítulo (ver [`REFERENCIAS.md`](../../01-relatorio-abnt/REFERENCIAS.md)): Martin (*Arquitetura limpa*), Gamma et al. (*Padrões de projeto*), Evans (*Domain-Driven Design*) e Fowler (*Padrões de arquitetura de aplicações corporativas*).
