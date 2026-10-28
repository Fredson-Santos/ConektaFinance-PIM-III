using Microsoft.EntityFrameworkCore;
using PIM_III_Backend.Domain.Entities;

namespace PIM_III_Backend.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Budget> Budgets => Set<Budget>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Alert> Alerts => Set<Alert>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<OtpCode> OtpCodes => Set<OtpCode>();
    public DbSet<ImportBatch> ImportBatches => Set<ImportBatch>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Datas de auditoria tambem tem default no banco, para inserts feitos fora da API
        // (scripts SQL, procedures e seed manual).
        foreach (var property in modelBuilder.Model.GetEntityTypes()
                     .SelectMany(entity => entity.GetProperties())
                     .Where(property => property.Name is "CreatedAt" or "UpdatedAt"))
            property.SetDefaultValueSql("now()");
    }
}
