using FluentAssertions;
using Moq;
using PIM_III_Backend.Application.Dtos;
using PIM_III_Backend.Application.Exceptions;
using PIM_III_Backend.Application.Services;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Tests.Unit.Services;

public class ImportServiceTests
{
    private readonly Mock<IImportBatchRepository> _importBatchRepository = new();
    private readonly Mock<ITransactionRepository> _transactionRepository = new();
    private readonly Mock<ICategoryRepository> _categoryRepository = new();
    private readonly ImportService _service;

    public ImportServiceTests() =>
        _service = new ImportService(_importBatchRepository.Object, _transactionRepository.Object, _categoryRepository.Object,
            new PIM_III_Backend.Infrastructure.Importing.StatementParser());

    private void SetupCategories()
    {
        _categoryRepository.Setup(r => r.ListAsync(1, null)).ReturnsAsync(new List<Category>
        {
            new() { Id = 1, UserId = 1, Name = "Alimentação", Kind = CategoryKind.Expense },
            new() { Id = 2, UserId = 1, Name = "Transporte", Kind = CategoryKind.Expense },
            new() { Id = 3, UserId = 1, Name = "Outros", Kind = CategoryKind.Expense },
            new() { Id = 10, UserId = 1, Name = "Salário", Kind = CategoryKind.Income },
            new() { Id = 13, UserId = 1, Name = "Outras entradas", Kind = CategoryKind.Income }
        });
    }

    private static MemoryStream CsvContent() => new(
        "Data;Descricao;Valor\r\n01/10/2026;Uber corrida;-32,90\r\n05/10/2026;Salario mensal;5200,00\r\n"u8.ToArray());

    [Fact]
    public async Task Previa_de_csv_detecta_lancamentos_sugestoes_e_duplicados()
    {
        SetupCategories();
        _transactionRepository.Setup(r => r.ExistsExternalAsync(1, It.Is<string>(s => s.Length > 20)))
            .ReturnsAsync(true);

        var preview = await _service.PreviewAsync(1, "extrato.csv", CsvContent(), 512);

        preview.Items.Should().HaveCount(2);
        preview.Items[0].Type.Should().Be("expense");
        preview.Items[0].SuggestedCategory!.Name.Should().Be("Transporte");
        preview.Items[0].IsDuplicate.Should().BeTrue();
        preview.Items[1].Type.Should().Be("income");
        preview.Items[1].Amount.Should().Be(5200m);
        _importBatchRepository.Verify(r => r.AddAsync(It.IsAny<ImportBatch>()), Times.Once);
    }

    [Fact]
    public async Task Previa_de_formato_insuportado_lanca_400()
    {
        var act = () => _service.PreviewAsync(1, "extrato.pdf", new MemoryStream([1]), 1);

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(400);
    }

    [Fact]
    public async Task Confirmacao_importa_itens_com_categoria_sugerida()
    {
        SetupCategories();
        var batch = new ImportBatch { Id = 7, UserId = 1, Status = ImportStatus.Pending, ItemsJson = """
            [{"Index":0,"Date":"2026-10-01T00:00:00","Description":"Uber corrida","Amount":32.90,"Type":"expense","SuggestedCategory":{"Id":2,"Name":"Transporte","ColorCode":"#0070f3","Icon":"Car"},"IsDuplicate":false}]
            """ };
        _importBatchRepository.Setup(r => r.GetByIdAndUserAsync(7, 1)).ReturnsAsync(batch);
        _transactionRepository.Setup(r => r.ExistsExternalAsync(1, It.IsAny<string>())).ReturnsAsync(false);
        var captured = new List<Transaction>();
        _transactionRepository.Setup(r => r.AddAsync(Capture.In(captured)));

        var result = await _service.ConfirmAsync(1, 7, new ConfirmImportRequest([0], true, true));

        result.ImportedCount.Should().Be(1);
        result.SkippedDuplicates.Should().Be(0);
        captured.Should().ContainSingle();
        captured[0].CategoryId.Should().Be(2);
        captured[0].Source.Should().Be(TransactionSource.Import);
        captured[0].ImportBatchId.Should().Be(7);
        captured[0].ExternalId.Should().NotBeNullOrWhiteSpace();
        batch.Status.Should().Be(ImportStatus.Confirmed);
    }

    [Fact]
    public async Task Confirmacao_ignora_duplicados_quando_solicitado()
    {
        SetupCategories();
        var batch = new ImportBatch { Id = 7, UserId = 1, Status = ImportStatus.Pending, ItemsJson = """
            [{"Index":0,"Date":"2026-10-01T00:00:00","Description":"Uber corrida","Amount":32.90,"Type":"expense","SuggestedCategory":null,"IsDuplicate":false}]
            """ };
        _importBatchRepository.Setup(r => r.GetByIdAndUserAsync(7, 1)).ReturnsAsync(batch);
        _transactionRepository.Setup(r => r.ExistsExternalAsync(1, It.IsAny<string>())).ReturnsAsync(true);

        var result = await _service.ConfirmAsync(1, 7, new ConfirmImportRequest([0], true, true));

        result.ImportedCount.Should().Be(0);
        result.SkippedDuplicates.Should().Be(1);
        _transactionRepository.Verify(r => r.AddAsync(It.IsAny<Transaction>()), Times.Never);
    }

    [Fact]
    public async Task Confirmacao_de_lote_ja_processado_lanca_409()
    {
        SetupCategories();
        _importBatchRepository.Setup(r => r.GetByIdAndUserAsync(7, 1))
            .ReturnsAsync(new ImportBatch { Id = 7, UserId = 1, Status = ImportStatus.Confirmed });

        var act = () => _service.ConfirmAsync(1, 7, new ConfirmImportRequest([0], true, true));

        var exception = await act.Should().ThrowAsync<AppException>();
        exception.Which.StatusCode.Should().Be(409);
    }

    [Fact]
    public async Task Confirmacao_sem_categoria_sugerida_cai_nos_outros()
    {
        SetupCategories();
        var batch = new ImportBatch { Id = 7, UserId = 1, Status = ImportStatus.Pending, ItemsJson = """
            [{"Index":0,"Date":"2026-10-01T00:00:00","Description":"Pagamento estranho","Amount":10.0,"Type":"expense","SuggestedCategory":null,"IsDuplicate":false}]
            """ };
        _importBatchRepository.Setup(r => r.GetByIdAndUserAsync(7, 1)).ReturnsAsync(batch);
        _transactionRepository.Setup(r => r.ExistsExternalAsync(1, It.IsAny<string>())).ReturnsAsync(false);
        var captured = new List<Transaction>();
        _transactionRepository.Setup(r => r.AddAsync(Capture.In(captured)));

        await _service.ConfirmAsync(1, 7, new ConfirmImportRequest([0], false, true));

        captured[0].CategoryId.Should().Be(3);
    }
}
