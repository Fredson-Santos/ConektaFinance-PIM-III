using Microsoft.EntityFrameworkCore;
using PIM_III_Backend.Domain.Entities;

namespace PIM_III_Backend.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Category> Categories { get; set; } = null!;
    public DbSet<Expense> Expenses { get; set; } = null!;
    public DbSet<Budget> Budgets { get; set; } = null!;
    public DbSet<Alert> Alerts { get; set; } = null!;
    public DbSet<Income> Incomes { get; set; } = null!;
    public DbSet<ChatMessage> ChatMessages { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Seed Categorias
        modelBuilder.Entity<Category>().HasData(
            new Category { Id = 1, Name = "Alimentação", Description = "Restaurantes, supermercados, etc.", ColorCode = "#FF5733", Icon = "restaurant", CreatedAt = new DateTime(2026, 5, 9, 0, 0, 0, DateTimeKind.Utc) },
            new Category { Id = 2, Name = "Transporte", Description = "Combustível, passagens, apps de transporte", ColorCode = "#33FF57", Icon = "directions_car", CreatedAt = new DateTime(2026, 5, 9, 0, 0, 0, DateTimeKind.Utc) },
            new Category { Id = 3, Name = "Lazer", Description = "Cinema, viagens, hobbies", ColorCode = "#3357FF", Icon = "movie", CreatedAt = new DateTime(2026, 5, 9, 0, 0, 0, DateTimeKind.Utc) },
            new Category { Id = 4, Name = "Saúde", Description = "Farmácia, consultas, exames", ColorCode = "#FF33F1", Icon = "medical_services", CreatedAt = new DateTime(2026, 5, 9, 0, 0, 0, DateTimeKind.Utc) },
            new Category { Id = 5, Name = "Educação", Description = "Cursos, mensalidades, livros", ColorCode = "#33FFF6", Icon = "school", CreatedAt = new DateTime(2026, 5, 9, 0, 0, 0, DateTimeKind.Utc) },
            new Category { Id = 6, Name = "Moradia", Description = "Aluguel, contas de luz/água, manutenção", ColorCode = "#FFC300", Icon = "home", CreatedAt = new DateTime(2026, 5, 9, 0, 0, 0, DateTimeKind.Utc) },
            new Category { Id = 7, Name = "Outros", Description = "Gastos diversos", ColorCode = "#900C3F", Icon = "more_horiz", CreatedAt = new DateTime(2026, 5, 9, 0, 0, 0, DateTimeKind.Utc) }
        );
    }
}
