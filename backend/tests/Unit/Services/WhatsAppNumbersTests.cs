using FluentAssertions;
using PIM_III_Backend.Application.Services;

namespace PIM_III_Backend.Tests.Unit.Services;

public class WhatsAppNumbersTests
{
    [Theory]
    [InlineData("5511987654321@s.whatsapp.net", "11987654321")] // celular com 55
    [InlineData("551198765432@s.whatsapp.net", "1198765432")] // fixo com 55
    [InlineData("5511987654321:5@s.whatsapp.net", "11987654321")] // sufixo de dispositivo
    [InlineData("11987654321@s.whatsapp.net", "11987654321")] // sem 55
    public void TryNormalizeFromJid_extrai_o_telefone_do_dominio(string jid, string expected)
    {
        WhatsAppNumbers.TryNormalizeFromJid(jid).Should().Be(expected);
    }

    [Theory]
    [InlineData("5511987654321-1234567890@g.us")] // grupo
    [InlineData("status@broadcast")] // lista de status
    [InlineData("1234@newsletter")] // newsletter
    [InlineData("12345@s.whatsapp.net")] // curto demais
    [InlineData("5511987654321999@s.whatsapp.net")] // longo demais
    [InlineData("")]
    [InlineData(null)]
    public void TryNormalizeFromJid_rejeita_formatos_invalidos(string? jid)
    {
        WhatsAppNumbers.TryNormalizeFromJid(jid).Should().BeNull();
    }

    [Theory]
    [InlineData("(11) 98765-4321", "11987654321")]
    [InlineData("+55 11 98765-4321", "11987654321")]
    [InlineData("5511987654321", "11987654321")]
    [InlineData("11987654321", "11987654321")]
    public void NormalizePhone_remove_formatacao_e_prefixo_do_pais(string input, string expected)
    {
        WhatsAppNumbers.NormalizePhone(input).Should().Be(expected);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("sem-digitos")]
    public void NormalizePhone_sem_digitos_retorna_null(string? input)
    {
        WhatsAppNumbers.NormalizePhone(input).Should().BeNull();
    }

    [Fact]
    public void NormalizePhone_preserva_digitos_de_entradas_exoticas()
    {
        WhatsAppNumbers.NormalizePhone("123456789012345").Should().Be("123456789012345");
    }

    [Fact]
    public void ToEvolution_adiciona_prefixo_do_pais()
    {
        WhatsAppNumbers.ToEvolution("11987654321").Should().Be("5511987654321");
    }

    [Fact]
    public void ToEvolution_mantem_numeros_ja_com_prefixo_ou_exoticos()
    {
        WhatsAppNumbers.ToEvolution("5511987654321").Should().Be("5511987654321");
        WhatsAppNumbers.ToEvolution("12345").Should().Be("12345");
    }

    [Theory]
    [InlineData("11987654321", "11*****4321")]
    [InlineData("1187654321", "11*****4321")]
    [InlineData("1234", "****")]
    [InlineData("", "desconhecido")]
    [InlineData(null, "desconhecido")]
    public void MaskPhone_oculta_digitos_sensiveis(string? phone, string expected)
    {
        WhatsAppNumbers.MaskPhone(phone).Should().Be(expected);
    }

    [Fact]
    public void GetLookupCandidates_gera_variantes_com_e_sem_nono_digito()
    {
        // 11 dígitos com 9 -> deve gerar com e sem o 9
        WhatsAppNumbers.GetLookupCandidates("11987654321")
            .Should().ContainInOrder("11987654321", "1187654321");

        // 10 dígitos (celular sem o 9) -> deve gerar sem e com o 9
        WhatsAppNumbers.GetLookupCandidates("1187654321")
            .Should().ContainInOrder("1187654321", "11987654321");

        // Entrada vazia
        WhatsAppNumbers.GetLookupCandidates("")
            .Should().BeEmpty();
    }
}
