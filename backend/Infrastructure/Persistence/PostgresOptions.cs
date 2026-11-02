using Microsoft.EntityFrameworkCore;

namespace PIM_III_Backend.Infrastructure.Persistence;

public static class PostgresOptions
{
    // Datas sao gravadas em UTC por convencao do dominio (DateTime.UtcNow) e algumas
    // sao montadas sem Kind (inicio de mes); o modo legado mapeia DateTime para
    // "timestamp without time zone" e evita rejeicoes do Npgsql por Kind.
    // Precisa rodar antes de qualquer uso do Npgsql no processo.
    public static void EnableLegacyTimestamps() =>
        AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

    public static DbContextOptionsBuilder UseConektaPostgres(this DbContextOptionsBuilder options, string? connectionString)
    {
        EnableLegacyTimestamps();
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException(
                "ConnectionStrings:DefaultConnection nao configurada. Informe a conexao com o PostgreSQL.");
        return options
            .UseNpgsql(connectionString)
            .UseSnakeCaseNamingConvention();
    }
}
