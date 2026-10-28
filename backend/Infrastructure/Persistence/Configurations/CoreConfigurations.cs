using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PIM_III_Backend.Domain.Entities;

namespace PIM_III_Backend.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);
        builder.ToTable(t =>
        {
            t.HasComment("Contas de acesso da plataforma (web, PWA e WhatsApp).");
            t.HasCheckConstraint("ck_users_email_minusculo", "email = lower(email)");
            t.HasCheckConstraint("ck_users_monthly_ceiling", "monthly_ceiling >= 0");
            t.HasCheckConstraint("ck_users_cycle_start_day", "cycle_start_day BETWEEN 1 AND 28");
            t.HasCheckConstraint("ck_users_currency", "char_length(currency) = 3");
            t.HasCheckConstraint("ck_users_account_type", "account_type IN ('Standard', 'Admin')");
        });
        builder.Property(u => u.MonthlyCeiling).HasComment("Teto global de gastos do mes definido no onboarding (R$).");
        builder.Property(u => u.CycleStartDay).HasComment("Dia do mes em que o ciclo financeiro do usuario comeca (1 a 28).");
        builder.Property(u => u.OnboardingCompletedAt).HasComment("Conclusao do fluxo de primeiro acesso; nulo enquanto pendente.");
        builder.Property(u => u.FullName).IsRequired().HasMaxLength(255);
        builder.Property(u => u.DisplayName).HasMaxLength(120);
        builder.Property(u => u.Email).IsRequired().HasMaxLength(255);
        builder.Property(u => u.PasswordHash).IsRequired();
        builder.Property(u => u.Phone).HasMaxLength(20);
        builder.Property(u => u.Cpf).HasMaxLength(14);
        builder.Property(u => u.Occupation).HasMaxLength(120);
        builder.Property(u => u.AvatarUrl).HasMaxLength(500);
        builder.Property(u => u.AccountType).IsRequired().HasMaxLength(20).HasDefaultValue("Standard")
            .HasComment("Perfil de acesso: Standard (usuario) ou Admin (painel administrativo).");
        builder.Property(u => u.IsActive).HasDefaultValue(true)
            .HasComment("Contas desativadas pelo administrador nao conseguem autenticar.");
        builder.Property(u => u.MonthlyCeiling).HasPrecision(18, 2);
        builder.Property(u => u.Currency).IsRequired().HasMaxLength(3).HasDefaultValue("BRL");
        builder.Property(u => u.CycleStartDay).HasDefaultValue(1);
        builder.HasIndex(u => u.Email).IsUnique();
    }
}

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.HasKey(c => c.Id);
        builder.ToTable(t =>
        {
            t.HasComment("Categorias de receitas e despesas, isoladas por usuario.");
            t.HasCheckConstraint("ck_categories_kind", "kind IN (0, 1)");
            t.HasCheckConstraint("ck_categories_color_code", "color_code ~ '^#[0-9A-Fa-f]{6}$'");
        });
        builder.Property(c => c.Kind).HasComment("0 = Despesa, 1 = Receita.");
        builder.Property(c => c.IsSystem).HasComment("Categoria clonada do modelo padrao no cadastro.");
        builder.Property(c => c.Name).IsRequired().HasMaxLength(100);
        builder.Property(c => c.Description).HasMaxLength(300);
        builder.Property(c => c.ColorCode).IsRequired().HasMaxLength(7);
        builder.Property(c => c.Icon).IsRequired().HasMaxLength(40);
        builder.Property(c => c.SortOrder).HasDefaultValue(0);
        builder.HasOne(c => c.User)
            .WithMany(u => u.Categories)
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(c => new { c.UserId, c.Name }).IsUnique();
    }
}

public class BudgetConfiguration : IEntityTypeConfiguration<Budget>
{
    public void Configure(EntityTypeBuilder<Budget> builder)
    {
        builder.HasKey(b => b.Id);
        builder.ToTable(t =>
        {
            t.HasComment("Teto de gastos por categoria em um mes/ano.");
            t.HasCheckConstraint("ck_budgets_limit_value", "limit_value >= 0");
            t.HasCheckConstraint("ck_budgets_period_month", "period_month BETWEEN 1 AND 12");
            t.HasCheckConstraint("ck_budgets_period_year", "period_year BETWEEN 2000 AND 2100");
        });
        builder.Property(b => b.LimitValue).HasComment("Valor maximo planejado para a categoria no periodo (R$).");
        builder.Property(b => b.LimitValue).HasPrecision(18, 2);
        builder.HasOne(b => b.User)
            .WithMany(u => u.Budgets)
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(b => b.Category)
            .WithMany(c => c.Budgets)
            .HasForeignKey(b => b.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(b => new { b.UserId, b.CategoryId, b.PeriodMonth, b.PeriodYear }).IsUnique();
    }
}
