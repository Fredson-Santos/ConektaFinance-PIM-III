using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using PIM_III_Backend.Infrastructure.Persistence;

namespace PIM_III_Backend.Infrastructure.Persistence;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite("Data Source=financeiro.db")
            .Options;
        return new AppDbContext(options);
    }
}
