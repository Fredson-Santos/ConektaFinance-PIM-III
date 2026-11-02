using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using PIM_III_Backend.Infrastructure.Persistence;

namespace PIM_III_Backend.Infrastructure.Persistence;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>();
        options.UseConektaPostgres(Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? "Host=localhost;Port=5433;Database=conektafinance");
        return new AppDbContext(options.Options);
    }
}
