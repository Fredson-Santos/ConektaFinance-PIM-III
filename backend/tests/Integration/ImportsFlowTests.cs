using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using PIM_III_Backend.Application.Dtos;
using Xunit;

namespace PIM_III_Backend.Tests.Integration;

public class ImportsFlowTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    private static readonly System.Text.Json.JsonSerializerOptions Json = TestJson.Options;
    private readonly HttpClient _client = factory.CreateClient();

    private async Task<HttpClient> CreateUserClientAsync()
    {
        var email = $"{Guid.NewGuid():N}@conekta.teste";
        var register = await _client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest("Usuario Import", email, "SenhaForte@123", null, null));
        var auth = await register.Content.ReadFromJsonAsync<AuthResponse>(Json);
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
        return client;
    }

    private static MultipartFormDataContent BuildCsvUpload(string fileName)
    {
        var csv = "Data;Descricao;Valor\r\n" +
                  $"{DateTime.UtcNow.AddDays(-2):dd/MM/yyyy};Uber corrida;-32,90\r\n" +
                  $"{DateTime.UtcNow.AddDays(-1):dd/MM/yyyy};Mercado do bairro;-186,40\r\n" +
                  $"{DateTime.UtcNow.AddDays(-1):dd/MM/yyyy};Farmacia total;-45,00\r\n";
        var form = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(System.Text.Encoding.UTF8.GetBytes(csv));
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("text/csv");
        form.Add(fileContent, "file", fileName);
        return form;
    }

    [Fact]
    public async Task Previa_e_confirmacao_importam_lancamentos_do_csv()
    {
        var client = await CreateUserClientAsync();

        var previewResponse = await client.PostAsync("/api/v1/imports/preview", BuildCsvUpload("extrato.csv"));
        previewResponse.StatusCode.Should().Be(HttpStatusCode.Accepted);
        var preview = await previewResponse.Content.ReadFromJsonAsync<ImportPreviewResponse>(Json);
        preview!.Items.Should().HaveCount(3);
        preview.Items.Should().Contain(i => i.SuggestedCategory!.Name == "Transporte");
        preview.Items.Should().Contain(i => i.SuggestedCategory!.Name == "Alimentação");

        var confirmResponse = await client.PostAsJsonAsync($"/api/v1/imports/{preview.BatchId}/confirm",
            new ConfirmImportRequest([0, 1, 2], true, true));
        var confirmBody = await confirmResponse.Content.ReadAsStringAsync();
        confirmResponse.StatusCode.Should().Be(HttpStatusCode.OK, confirmBody);
        var result = await confirmResponse.Content.ReadFromJsonAsync<ImportResultResponse>(Json);
        result!.ImportedCount.Should().Be(3);

        var transactions = await (await client.GetAsync("/api/v1/transactions?search=uber")).Content
            .ReadFromJsonAsync<TransactionListResponse>(Json);
        transactions!.Items.Should().ContainSingle(t => t.Source == Domain.Enums.TransactionSource.Import);
    }

    [Fact]
    public async Task Reimportacao_do_mesmo_arquivo_detecta_duplicados_e_ignora()
    {
        var client = await CreateUserClientAsync();

        var firstPreview = await (await client.PostAsync("/api/v1/imports/preview", BuildCsvUpload("extrato.csv")))
            .Content.ReadFromJsonAsync<ImportPreviewResponse>(Json);
        await client.PostAsJsonAsync($"/api/v1/imports/{firstPreview!.BatchId}/confirm",
            new ConfirmImportRequest([0, 1, 2], true, true));

        var secondPreviewResponse = await client.PostAsync("/api/v1/imports/preview", BuildCsvUpload("extrato.csv"));
        var secondPreview = await secondPreviewResponse.Content.ReadFromJsonAsync<ImportPreviewResponse>(Json);
        secondPreview!.Items.Should().OnlyContain(i => i.IsDuplicate);

        var secondConfirm = await client.PostAsJsonAsync($"/api/v1/imports/{secondPreview.BatchId}/confirm",
            new ConfirmImportRequest([0, 1, 2], true, true));
        var result = await secondConfirm.Content.ReadFromJsonAsync<ImportResultResponse>(Json);
        result!.ImportedCount.Should().Be(0);
        result.SkippedDuplicates.Should().Be(3);
    }

    [Fact]
    public async Task Confirmacao_duplicada_do_mesmo_lote_retorna_409()
    {
        var client = await CreateUserClientAsync();
        var preview = await (await client.PostAsync("/api/v1/imports/preview", BuildCsvUpload("extrato.csv")))
            .Content.ReadFromJsonAsync<ImportPreviewResponse>(Json);

        var first = await client.PostAsJsonAsync($"/api/v1/imports/{preview!.BatchId}/confirm",
            new ConfirmImportRequest([0, 1, 2], true, true));
        first.StatusCode.Should().Be(HttpStatusCode.OK);
        var second = await client.PostAsJsonAsync($"/api/v1/imports/{preview.BatchId}/confirm",
            new ConfirmImportRequest([0, 1, 2], true, true));
        second.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Formato_insuportado_retorna_400()
    {
        var client = await CreateUserClientAsync();
        using var form = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent([1, 2, 3]);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
        form.Add(fileContent, "file", "extrato.pdf");

        var response = await client.PostAsync("/api/v1/imports/preview", form);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
