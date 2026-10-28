using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Text;
using System.Threading.RateLimiting;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PIM_III_Backend.Application.Middleware;
using PIM_III_Backend.Application.Services;
using PIM_III_Backend.Domain.Interfaces;
using PIM_III_Backend.Infrastructure.Persistence;
using PIM_III_Backend.Infrastructure.Persistence.Repositories;
using PIM_III_Backend.Infrastructure.Messaging;
using PIM_III_Backend.Infrastructure.Copilot;
using PIM_III_Backend.Infrastructure.Files;
using PIM_III_Backend.Infrastructure.Importing;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
});
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.OpenApiInfo
    {
        Title = "ConektaFinance API",
        Version = "v1",
        Description = "API da plataforma ConektaFinance de gestao financeira pessoal."
    });
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.ParameterLocation.Header,
        Description = "Informe o token JWT obtido em /api/v1/auth."
    });
    options.AddSecurityRequirement(document => new Microsoft.OpenApi.OpenApiSecurityRequirement
    {
        [new Microsoft.OpenApi.OpenApiSecuritySchemeReference("Bearer", document)] = new List<string>()
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseConektaPostgres(builder.Configuration.GetConnectionString("DefaultConnection")));

var jwtSettings = builder.Configuration.GetSection("JwtSettings");
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();
var jwtSecret = builder.Configuration["JWT_SECRET"];
if (string.IsNullOrWhiteSpace(jwtSecret))
{
    if (builder.Environment.IsDevelopment())
    {
        jwtSecret = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?> { ["JWT_SECRET"] = jwtSecret });
    }
    else
        throw new InvalidOperationException("JWT_SECRET nao configurado. Defina a variavel de ambiente.");
}

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.SaveToken = true;
        // Mantem os nomes curtos das claims (sub, role) usados em NameClaimType/RoleClaimType.
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidateAudience = true,
            ValidAudience = jwtSettings["Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
            NameClaimType = "sub",
            RoleClaimType = "role"
        };
        options.Events = new JwtBearerEvents
        {
            OnChallenge = async context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/problem+json";
                var problem = new
                {
                    title = "Sessao invalida ou expirada.",
                    status = 401,
                    detail = "Faca login novamente para continuar."
                };
                await context.Response.WriteAsync(JsonSerializer.Serialize(problem));
            }
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [])
        .AllowAnyHeader()
        .AllowAnyMethod()));

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.ContentType = "application/problem+json";
        var problem = new
        {
            title = "Muitas solicitacoes.",
            status = 429,
            detail = "Aguarde alguns instantes antes de tentar novamente."
        };
        await context.HttpContext.Response.WriteAsync(JsonSerializer.Serialize(problem), cancellationToken);
    };
    options.AddPolicy("auth", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "anonimo",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = builder.Configuration.GetValue("RateLimit:AuthPermitLimit", 20),
                Window = TimeSpan.FromSeconds(builder.Configuration.GetValue("RateLimit:AuthWindowSeconds", 60))
            }));
    options.AddPolicy("otp", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            $"otp:{context.Connection.RemoteIpAddress?.ToString() ?? "anonimo"}",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 3, Window = TimeSpan.FromSeconds(45) }));
    options.AddPolicy("webhook", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "anonimo",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = builder.Configuration.GetValue("RateLimit:WebhookPermitLimit", 100),
                Window = TimeSpan.FromSeconds(builder.Configuration.GetValue("RateLimit:WebhookWindowSeconds", 60))
            }));
});

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IBudgetRepository, BudgetRepository>();
builder.Services.AddScoped<ITransactionRepository, TransactionRepository>();
builder.Services.AddScoped<IAlertRepository, AlertRepository>();
builder.Services.AddScoped<IChatMessageRepository, ChatMessageRepository>();
builder.Services.AddScoped<IOtpRepository, OtpRepository>();
builder.Services.AddScoped<IImportBatchRepository, ImportBatchRepository>();
builder.Services.AddScoped<IMonthlyClosingRepository, MonthlyClosingRepository>();
builder.Services.AddScoped<IAdminRepository, AdminRepository>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IOtpService, OtpService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<IBudgetService, BudgetService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IAlertService, AlertService>();
builder.Services.AddScoped<ICopilotToolProvider, CopilotToolProvider>();
builder.Services.AddScoped<ICopilotImageStorage, LocalCopilotImageStorage>();
builder.Services.AddScoped<RuleBasedCopilotClient>();
if (!string.IsNullOrWhiteSpace(builder.Configuration["Copilot:BaseUrl"]) &&
    !string.IsNullOrWhiteSpace(builder.Configuration["Copilot:ApiKey"]))
{
    builder.Services.AddHttpClient();
    builder.Services.AddScoped<LlmCopilotClient>();
    builder.Services.AddScoped<ICopilotAiClient>(sp =>
        new CompositeCopilotClient(
            sp.GetRequiredService<LlmCopilotClient>(),
            sp.GetRequiredService<RuleBasedCopilotClient>(),
            sp.GetRequiredService<ILogger<CompositeCopilotClient>>()));
}
else
{
    builder.Services.AddScoped<ICopilotAiClient>(sp =>
        new CompositeCopilotClient(
            null,
            sp.GetRequiredService<RuleBasedCopilotClient>(),
            sp.GetRequiredService<ILogger<CompositeCopilotClient>>()));
}
builder.Services.AddScoped<ICopilotService, CopilotService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IAvatarStorage, LocalAvatarStorage>();
builder.Services.AddScoped<IStatementParser, StatementParser>();
builder.Services.AddScoped<IImportService, ImportService>();
builder.Services.AddHttpClient();
builder.Services.AddMemoryCache();

// Canal WhatsApp (Evolution API): o mesmo CopilotService do painel web,
// acionado pelo webhook publico /api/v1/webhooks/whatsapp.
builder.Services.AddScoped<EvolutionClient>();
builder.Services.AddScoped<IEvolutionClient>(sp => sp.GetRequiredService<EvolutionClient>());
builder.Services.AddScoped<IWhatsAppChannelService, WhatsAppChannelService>();

builder.Services.AddScoped<IOtpSender>(sp =>
{
    var evolution = sp.GetRequiredService<IEvolutionClient>();
    return evolution.IsConfigured
        ? new EvolutionOtpSender(evolution,
            sp.GetRequiredService<IConfiguration>(),
            sp.GetRequiredService<ILogger<EvolutionOtpSender>>())
        : new DevOtpSender(
            sp.GetRequiredService<ILogger<DevOtpSender>>(),
            sp.GetRequiredService<IConfiguration>());
});

var app = builder.Build();

if (string.IsNullOrWhiteSpace(app.Configuration["JWT_SECRET"]) && app.Environment.IsDevelopment())
    app.Logger.LogWarning("JWT_SECRET ausente: usando chave efemera valida apenas para desenvolvimento.");

app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<ErrorHandlingMiddleware>();
if (!app.Environment.IsDevelopment())
    app.UseHsts();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    SeedData.Initialize(context);
    SeedData.EnsureAdmin(context, app.Configuration);
}

// Fora de Development o Swagger so abre com Swagger__Enabled=true (demonstracao para a banca).
if (app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("Swagger:Enabled"))
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok", timestamp = DateTime.UtcNow }));
app.Run();

public partial class Program { }
