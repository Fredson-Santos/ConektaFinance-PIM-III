using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PIM_III_Backend.Domain.Entities;

namespace PIM_III_Backend.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);
        builder.Property(u => u.FullName).IsRequired().HasMaxLength(255);
        builder.Property(u => u.DisplayName).HasMaxLength(120);
        builder.Property(u => u.Email).IsRequired().HasMaxLength(255);
        builder.Property(u => u.PasswordHash).IsRequired();
        builder.Property(u => u.Phone).HasMaxLength(20);
        builder.Property(u => u.Cpf).HasMaxLength(14);
        builder.Property(u => u.Occupation).HasMaxLength(120);
        builder.Property(u => u.AvatarUrl).HasMaxLength(500);
        builder.Property(u => u.AccountType).IsRequired().HasMaxLength(20).HasDefaultValue("Standard");
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
