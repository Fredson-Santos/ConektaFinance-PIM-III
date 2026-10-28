using Npgsql;
using PIM_III_Backend.Infrastructure.Persistence;
using Testcontainers.PostgreSql;

namespace PIM_III_Backend.Tests.Integration;

// Um unico container PostgreSQL para toda a suite; cada fabrica de testes
// cria o proprio banco para manter as classes isoladas entre si.
public static class PostgresTestServer
{
    private static readonly SemaphoreSlim Gate = new(1, 1);
    private static PostgreSqlContainer? _container;

    public static async Task<string> CreateDatabaseAsync()
    {
        PostgresOptions.EnableLegacyTimestamps();
        await Gate.WaitAsync();
        try
        {
            if (_container is null)
            {
                var container = new PostgreSqlBuilder("postgres:16-alpine").Build();
                await container.StartAsync();
                _container = container;
            }
        }
        finally
        {
            Gate.Release();
        }

        var database = $"conekta_test_{Guid.NewGuid():N}";
        await using (var connection = new NpgsqlConnection(_container.GetConnectionString()))
        {
            await connection.OpenAsync();
            await using var command = new NpgsqlCommand($"CREATE DATABASE {database}", connection);
            await command.ExecuteNonQueryAsync();
        }

        return new NpgsqlConnectionStringBuilder(_container.GetConnectionString()) { Database = database }
            .ConnectionString;
    }
}
