using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using PIM_III_Backend.Application.Dtos.Expenses;
using PIM_III_Backend.Application.Services;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class IntegrationController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly IUserRepository _userRepository;
    private readonly IExpenseService _expenseService;
    private readonly IAlertService _alertService;
    private readonly IReportService _reportService;
    private readonly IInsightService _insightService;

    public IntegrationController(
        IConfiguration configuration,
        IUserRepository userRepository,
        IExpenseService expenseService,
        IAlertService alertService,
        IReportService reportService,
        IInsightService insightService)
    {
        _configuration = configuration;
        _userRepository = userRepository;
        _expenseService = expenseService;
        _alertService = alertService;
        _reportService = reportService;
        _insightService = insightService;
    }

    [HttpPost("expense")]
    public async Task<IActionResult> CreateExpenseFromIntegration([FromBody] IntegrationExpenseRequest request)
    {
        // 1. Validar a presença e correspondência da X-API-KEY
        if (!Request.Headers.TryGetValue("X-API-KEY", out var extractedApiKey))
        {
            return Unauthorized(new { message = "Chave de API (X-API-KEY) não fornecida nos cabeçalhos da requisição." });
        }

        var configuredApiKey = _configuration["IntegrationSettings:ApiKey"];
        if (string.IsNullOrEmpty(configuredApiKey) || configuredApiKey != extractedApiKey)
        {
            return Unauthorized(new { message = "Chave de API inválida ou não configurada no servidor." });
        }

        // 2. Validar payload básico
        if (request == null)
        {
            return BadRequest(new { message = "Corpo da requisição vazio ou inválido." });
        }

        if (string.IsNullOrWhiteSpace(request.UserEmail))
        {
            return BadRequest(new { message = "O e-mail do usuário ('userEmail') é obrigatório." });
        }

        // 3. Buscar usuário pelo e-mail
        var user = await _userRepository.GetByEmailAsync(request.UserEmail);
        if (user == null)
        {
            return BadRequest(new { message = $"Usuário com e-mail '{request.UserEmail}' não encontrado no sistema." });
        }

        // 4. Mapear e criar a despesa
        try
        {
            var createExpenseRequest = new CreateExpenseRequest(
                request.CategoryId,
                request.Description,
                request.Value,
                request.TransactionDate,
                request.Observation,
                request.IsRecurrent
            );

            var createdExpense = await _expenseService.CreateAsync(user.Id, createExpenseRequest);

            // 5. Verificar alertas de orçamento
            try
            {
                await _alertService.CheckBudgetAlertsAsync(user.Id, request.CategoryId, request.Value);
            }
            catch (Exception ex)
            {
                // Registra o erro de alertas mas não invalida o cadastro da despesa
                Console.WriteLine($"Erro ao verificar alertas de orçamento via integração: {ex.Message}");
            }

            return Ok(createdExpense);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Erro interno ao processar a despesa: {ex.Message}" });
        }
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummaryFromIntegration([FromQuery] string userEmail, [FromQuery] DateTime? start = null, [FromQuery] DateTime? end = null)
    {
        // 1. Validar a presença e correspondência da X-API-KEY
        if (!Request.Headers.TryGetValue("X-API-KEY", out var extractedApiKey))
        {
            return Unauthorized(new { message = "Chave de API (X-API-KEY) não fornecida nos cabeçalhos da requisição." });
        }

        var configuredApiKey = _configuration["IntegrationSettings:ApiKey"];
        if (string.IsNullOrEmpty(configuredApiKey) || configuredApiKey != extractedApiKey)
        {
            return Unauthorized(new { message = "Chave de API inválida ou não configurada no servidor." });
        }

        if (string.IsNullOrWhiteSpace(userEmail))
        {
            return BadRequest(new { message = "O e-mail do usuário ('userEmail') é obrigatório." });
        }

        // 2. Buscar usuário pelo e-mail
        var user = await _userRepository.GetByEmailAsync(userEmail);
        if (user == null)
        {
            return BadRequest(new { message = $"Usuário com e-mail '{userEmail}' não encontrado no sistema." });
        }

        try
        {
            var expenses = await _expenseService.GetUserExpensesAsync(user.Id, start, end);
            var projectedExpenses = expenses.Select(e => new
            {
                CategoryName = e.CategoryName,
                Description = e.Description,
                Value = e.Value,
                TransactionDate = e.TransactionDate
            });
            return Ok(projectedExpenses);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Erro interno ao processar gastos: {ex.Message}" });
        }
    }

    [HttpGet("insights")]
    public async Task<IActionResult> GetInsightsFromIntegration([FromQuery] string userEmail)
    {
        // 1. Validar a presença e correspondência da X-API-KEY
        if (!Request.Headers.TryGetValue("X-API-KEY", out var extractedApiKey))
        {
            return Unauthorized(new { message = "Chave de API (X-API-KEY) não fornecida nos cabeçalhos da requisição." });
        }

        var configuredApiKey = _configuration["IntegrationSettings:ApiKey"];
        if (string.IsNullOrEmpty(configuredApiKey) || configuredApiKey != extractedApiKey)
        {
            return Unauthorized(new { message = "Chave de API inválida ou não configurada no servidor." });
        }

        if (string.IsNullOrWhiteSpace(userEmail))
        {
            return BadRequest(new { message = "O e-mail do usuário ('userEmail') é obrigatório." });
        }

        // 2. Buscar usuário pelo e-mail
        var user = await _userRepository.GetByEmailAsync(userEmail);
        if (user == null)
        {
            return BadRequest(new { message = $"Usuário com e-mail '{userEmail}' não encontrado no sistema." });
        }

        try
        {
            var insights = await _insightService.GetInsightsAsync(user.Id);
            return Ok(insights);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Erro interno ao processar insights: {ex.Message}" });
        }
    }
}

public record IntegrationExpenseRequest(
    string UserEmail,
    int CategoryId,
    string Description,
    decimal Value,
    DateTime TransactionDate,
    string Observation,
    bool IsRecurrent
);
