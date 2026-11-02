using System.Reflection;
using Microsoft.EntityFrameworkCore;

namespace PIM_III_Backend.Infrastructure.Persistence;

// Aplica as procedures, functions e triggers de database/ (embutidas no assembly).
// Os scripts sao idempotentes, entao rodam a cada startup apos as migrations.
public static class DatabaseProgrammability
{
    private const string ResourcePrefix = "Conekta.Sql.";

    public static void Apply(AppDbContext context)
    {
        var assembly = Assembly.GetExecutingAssembly();
        var scripts = assembly.GetManifestResourceNames()
            .Where(name => name.StartsWith(ResourcePrefix, StringComparison.Ordinal))
            .Order(StringComparer.Ordinal);

        foreach (var script in scripts)
        {
            using var stream = assembly.GetManifestResourceStream(script)!;
            using var reader = new StreamReader(stream);
            context.Database.ExecuteSqlRaw(reader.ReadToEnd());
        }
    }
}
