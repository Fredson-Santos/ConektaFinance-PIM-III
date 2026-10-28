using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;

namespace PIM_III_Backend.Infrastructure.Persistence.Configurations;

public class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
{
    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Description).IsRequired().HasMaxLength(255);
        builder.Property(t => t.Value).HasPrecision(18, 2);
        builder.Property(t => t.Observation).HasMaxLength(500);
        builder.Property(t => t.ExternalId).HasMaxLength(100);
        builder.HasOne(t => t.User)
            .WithMany(u => u.Transactions)
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(t => t.Category)
            .WithMany(c => c.Transactions)
            .HasForeignKey(t => t.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(t => t.ImportBatch)
            .WithMany()
            .HasForeignKey(t => t.ImportBatchId)
            .OnDelete(DeleteBehavior.SetNull);
        builder.HasIndex(t => new { t.UserId, t.TransactionDate });
        builder.HasIndex(t => new { t.UserId, t.ExternalId }).IsUnique();
    }
}

public class AlertConfiguration : IEntityTypeConfiguration<Alert>
{
    public void Configure(EntityTypeBuilder<Alert> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Title).IsRequired().HasMaxLength(120);
        builder.Property(a => a.Message).IsRequired().HasMaxLength(300);
        builder.Property(a => a.DedupKey).IsRequired().HasMaxLength(60);
        builder.HasOne(a => a.User)
            .WithMany(u => u.Alerts)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(a => a.Category)
            .WithMany()
            .HasForeignKey(a => a.CategoryId)
            .OnDelete(DeleteBehavior.SetNull);
        builder.HasIndex(a => new { a.UserId, a.DedupKey }).IsUnique();
    }
}

public class ChatMessageConfiguration : IEntityTypeConfiguration<ChatMessage>
{
    public void Configure(EntityTypeBuilder<ChatMessage> builder)
    {
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Content).IsRequired().HasMaxLength(4000);
        builder.Property(m => m.ActionPayload).HasMaxLength(2000);
        builder.Property(m => m.ImageUrl).HasMaxLength(300);
        builder.Property(m => m.Channel).HasDefaultValue(ChatChannel.Web);
        builder.HasOne(m => m.User)
            .WithMany(u => u.ChatMessages)
            .HasForeignKey(m => m.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(m => m.UserId);
        builder.HasIndex(m => new { m.UserId, m.Channel });
    }
}

public class OtpCodeConfiguration : IEntityTypeConfiguration<OtpCode>
{
    public void Configure(EntityTypeBuilder<OtpCode> builder)
    {
        builder.HasKey(o => o.Id);
        builder.Property(o => o.Phone).IsRequired().HasMaxLength(20);
        builder.Property(o => o.CodeHash).IsRequired();
        builder.HasIndex(o => new { o.Phone, o.CreatedAt });
    }
}

public class ImportBatchConfiguration : IEntityTypeConfiguration<ImportBatch>
{
    public void Configure(EntityTypeBuilder<ImportBatch> builder)
    {
        builder.HasKey(b => b.Id);
        builder.Property(b => b.FileName).IsRequired().HasMaxLength(255);
        builder.Property(b => b.ItemsJson).IsRequired();
        builder.HasOne(b => b.User)
            .WithMany(u => u.ImportBatches)
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
