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
        builder.ToTable(t =>
        {
            t.HasComment("Lancamentos financeiros unificados (receitas e despesas).");
            t.HasCheckConstraint("ck_transactions_value", "value > 0");
            t.HasCheckConstraint("ck_transactions_type", "type IN (0, 1)");
            t.HasCheckConstraint("ck_transactions_status", "status IN (0, 1)");
            t.HasCheckConstraint("ck_transactions_source", "source IN (0, 1, 2)");
            t.HasCheckConstraint("ck_transactions_payment_method", "payment_method IS NULL OR payment_method BETWEEN 0 AND 6");
        });
        builder.Property(t => t.Type).HasComment("0 = Despesa, 1 = Receita.");
        builder.Property(t => t.Status).HasComment("0 = Ativa, 1 = Cancelada.");
        builder.Property(t => t.Source).HasComment("Origem: 0 = Manual, 1 = Importacao de extrato, 2 = Assistente de IA.");
        builder.Property(t => t.PaymentMethod).HasComment("0 = Cartao, 1 = Pix, 2 = Boleto, 3 = Debito, 4 = Dinheiro, 5 = Transferencia, 6 = Outro.");
        builder.Property(t => t.ExternalId).HasComment("Identificador do lancamento no extrato importado (deduplicacao).");
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
        builder.ToTable(t =>
        {
            t.HasComment("Alertas de orcamento exibidos na central de notificacoes.");
            t.HasCheckConstraint("ck_alerts_type", "type IN (0, 1, 2)");
        });
        builder.Property(a => a.Type).HasComment("0 = Teto excedido, 1 = Limite de atencao (80%), 2 = Gasto elevado.");
        builder.Property(a => a.DedupKey).HasComment("Chave unica por usuario que impede alertas duplicados (cat:{id}:{ano}-{mes}:{tipo}).");
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
        builder.ToTable(t =>
        {
            t.HasComment("Historico de conversas com o assistente de IA.");
            t.HasCheckConstraint("ck_chat_messages_role", "role IN (0, 1)");
            t.HasCheckConstraint("ck_chat_messages_channel", "channel IN (0, 1)");
        });
        builder.Property(m => m.Role).HasComment("0 = Usuario, 1 = Assistente.");
        builder.Property(m => m.Channel).HasComment("0 = Web/PWA, 1 = WhatsApp.");
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
        builder.ToTable(t =>
        {
            t.HasComment("Codigos de verificacao enviados por WhatsApp (armazenados como hash).");
            t.HasCheckConstraint("ck_otp_codes_attempts", "attempts >= 0");
        });
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
        builder.ToTable(t =>
        {
            t.HasComment("Lotes de importacao de extratos bancarios (OFX, CSV, XLSX).");
            t.HasCheckConstraint("ck_import_batches_status", "status IN (0, 1, 2)");
        });
        builder.Property(b => b.Status).HasComment("0 = Pendente, 1 = Confirmado, 2 = Falhou.");
        builder.Property(b => b.FileName).IsRequired().HasMaxLength(255);
        builder.Property(b => b.ItemsJson).IsRequired();
        builder.HasOne(b => b.User)
            .WithMany(u => u.ImportBatches)
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
