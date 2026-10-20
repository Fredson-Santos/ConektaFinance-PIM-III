using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using PIM_III_Backend.Application.Exceptions;
using PIM_III_Backend.Application.Middleware;

namespace PIM_III_Backend.Tests.Unit;

public class ErrorHandlingMiddlewareTests
{
    private static async Task<(int status, ProblemDetails? body)> ExecuteAsync(Exception thrown)
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        context.Request.Path = "/api/v1/teste";
        var middleware = new ErrorHandlingMiddleware(_ => throw thrown, Mock.Of<ILogger<ErrorHandlingMiddleware>>());
        await middleware.InvokeAsync(context);
        var json = System.Text.Encoding.UTF8.GetString(((MemoryStream)context.Response.Body).ToArray());
        var body = JsonSerializer.Deserialize<ProblemDetails>(json,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true, PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        return (context.Response.StatusCode, body);
    }

    [Fact]
    public async Task AppException_deve_retornar_status_e_problemdetails_correspondentes()
    {
        var (status, body) = await ExecuteAsync(AppException.Conflict("Categoria em uso", "Existe um lancamento vinculado."));
        status.Should().Be(409);
        body.Should().NotBeNull();
        body!.Title.Should().Be("Categoria em uso");
        body.Detail.Should().Be("Existe um lancamento vinculado.");
        body.Status.Should().Be(409);
    }

    [Fact]
    public async Task Excecao_nao_tratada_deve_retornar_500_sem_vazar_detalhes_internos()
    {
        var (status, body) = await ExecuteAsync(new InvalidOperationException("detalhe interno sensivel"));
        status.Should().Be(500);
        body!.Detail.Should().NotContain("sensivel");
        body.Detail.Should().Be("Ocorreu um erro inesperado. Tente novamente em instantes.");
    }

    [Fact]
    public async Task Acesso_negado_deve_retornar_403()
    {
        var (status, body) = await ExecuteAsync(new UnauthorizedAccessException());
        status.Should().Be(403);
        body!.Title.Should().Be("Acesso negado");
    }

    [Fact]
    public async Task AppException_deve_incluir_dicionario_de_erros_quando_presente()
    {
        var errors = new Dictionary<string, string[]> { ["valor"] = ["deve ser maior que zero"] };
        var (status, body) = await ExecuteAsync(AppException.BadRequest("Dados invalidos", "Revise os campos.", errors));
        status.Should().Be(400);
        body!.Extensions.Should().ContainKey("errors");
    }
}
