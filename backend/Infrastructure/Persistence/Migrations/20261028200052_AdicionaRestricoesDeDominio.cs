using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PIM_III_Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AdicionaRestricoesDeDominio : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterTable(
                name: "users",
                comment: "Contas de acesso da plataforma (web, PWA e WhatsApp).");

            migrationBuilder.AlterTable(
                name: "transactions",
                comment: "Lancamentos financeiros unificados (receitas e despesas).");

            migrationBuilder.AlterTable(
                name: "otp_codes",
                comment: "Codigos de verificacao enviados por WhatsApp (armazenados como hash).");

            migrationBuilder.AlterTable(
                name: "import_batches",
                comment: "Lotes de importacao de extratos bancarios (OFX, CSV, XLSX).");

            migrationBuilder.AlterTable(
                name: "chat_messages",
                comment: "Historico de conversas com o assistente de IA.");

            migrationBuilder.AlterTable(
                name: "categories",
                comment: "Categorias de receitas e despesas, isoladas por usuario.");

            migrationBuilder.AlterTable(
                name: "budgets",
                comment: "Teto de gastos por categoria em um mes/ano.");

            migrationBuilder.AlterTable(
                name: "alerts",
                comment: "Alertas de orcamento exibidos na central de notificacoes.");

            migrationBuilder.AlterColumn<DateTime>(
                name: "updated_at",
                table: "users",
                type: "timestamp without time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "onboarding_completed_at",
                table: "users",
                type: "timestamp without time zone",
                nullable: true,
                comment: "Conclusao do fluxo de primeiro acesso; nulo enquanto pendente.",
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "monthly_ceiling",
                table: "users",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                comment: "Teto global de gastos do mes definido no onboarding (R$).",
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)",
                oldPrecision: 18,
                oldScale: 2);

            migrationBuilder.AlterColumn<int>(
                name: "cycle_start_day",
                table: "users",
                type: "integer",
                nullable: false,
                defaultValue: 1,
                comment: "Dia do mes em que o ciclo financeiro do usuario comeca (1 a 28).",
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 1);

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "users",
                type: "timestamp without time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "updated_at",
                table: "transactions",
                type: "timestamp without time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<int>(
                name: "type",
                table: "transactions",
                type: "integer",
                nullable: false,
                comment: "0 = Despesa, 1 = Receita.",
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<int>(
                name: "status",
                table: "transactions",
                type: "integer",
                nullable: false,
                comment: "0 = Ativa, 1 = Cancelada.",
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<int>(
                name: "source",
                table: "transactions",
                type: "integer",
                nullable: false,
                comment: "Origem: 0 = Manual, 1 = Importacao de extrato, 2 = Assistente de IA.",
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<int>(
                name: "payment_method",
                table: "transactions",
                type: "integer",
                nullable: true,
                comment: "0 = Cartao, 1 = Pix, 2 = Boleto, 3 = Debito, 4 = Dinheiro, 5 = Transferencia, 6 = Outro.",
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "external_id",
                table: "transactions",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true,
                comment: "Identificador do lancamento no extrato importado (deduplicacao).",
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "transactions",
                type: "timestamp without time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "otp_codes",
                type: "timestamp without time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<int>(
                name: "status",
                table: "import_batches",
                type: "integer",
                nullable: false,
                comment: "0 = Pendente, 1 = Confirmado, 2 = Falhou.",
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "import_batches",
                type: "timestamp without time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<int>(
                name: "role",
                table: "chat_messages",
                type: "integer",
                nullable: false,
                comment: "0 = Usuario, 1 = Assistente.",
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "chat_messages",
                type: "timestamp without time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<int>(
                name: "channel",
                table: "chat_messages",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                comment: "0 = Web/PWA, 1 = WhatsApp.",
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 0);

            migrationBuilder.AlterColumn<DateTime>(
                name: "updated_at",
                table: "categories",
                type: "timestamp without time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<int>(
                name: "kind",
                table: "categories",
                type: "integer",
                nullable: false,
                comment: "0 = Despesa, 1 = Receita.",
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<bool>(
                name: "is_system",
                table: "categories",
                type: "boolean",
                nullable: false,
                comment: "Categoria clonada do modelo padrao no cadastro.",
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "categories",
                type: "timestamp without time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "updated_at",
                table: "budgets",
                type: "timestamp without time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<decimal>(
                name: "limit_value",
                table: "budgets",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                comment: "Valor maximo planejado para a categoria no periodo (R$).",
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)",
                oldPrecision: 18,
                oldScale: 2);

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "budgets",
                type: "timestamp without time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "updated_at",
                table: "alerts",
                type: "timestamp without time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<int>(
                name: "type",
                table: "alerts",
                type: "integer",
                nullable: false,
                comment: "0 = Teto excedido, 1 = Limite de atencao (80%), 2 = Gasto elevado.",
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<string>(
                name: "dedup_key",
                table: "alerts",
                type: "character varying(60)",
                maxLength: 60,
                nullable: false,
                comment: "Chave unica por usuario que impede alertas duplicados (cat:{id}:{ano}-{mes}:{tipo}).",
                oldClrType: typeof(string),
                oldType: "character varying(60)",
                oldMaxLength: 60);

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "alerts",
                type: "timestamp without time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AddCheckConstraint(
                name: "ck_users_currency",
                table: "users",
                sql: "char_length(currency) = 3");

            migrationBuilder.AddCheckConstraint(
                name: "ck_users_cycle_start_day",
                table: "users",
                sql: "cycle_start_day BETWEEN 1 AND 28");

            migrationBuilder.AddCheckConstraint(
                name: "ck_users_email_minusculo",
                table: "users",
                sql: "email = lower(email)");

            migrationBuilder.AddCheckConstraint(
                name: "ck_users_monthly_ceiling",
                table: "users",
                sql: "monthly_ceiling >= 0");

            migrationBuilder.AddCheckConstraint(
                name: "ck_transactions_payment_method",
                table: "transactions",
                sql: "payment_method IS NULL OR payment_method BETWEEN 0 AND 6");

            migrationBuilder.AddCheckConstraint(
                name: "ck_transactions_source",
                table: "transactions",
                sql: "source IN (0, 1, 2)");

            migrationBuilder.AddCheckConstraint(
                name: "ck_transactions_status",
                table: "transactions",
                sql: "status IN (0, 1)");

            migrationBuilder.AddCheckConstraint(
                name: "ck_transactions_type",
                table: "transactions",
                sql: "type IN (0, 1)");

            migrationBuilder.AddCheckConstraint(
                name: "ck_transactions_value",
                table: "transactions",
                sql: "value > 0");

            migrationBuilder.AddCheckConstraint(
                name: "ck_otp_codes_attempts",
                table: "otp_codes",
                sql: "attempts >= 0");

            migrationBuilder.AddCheckConstraint(
                name: "ck_import_batches_status",
                table: "import_batches",
                sql: "status IN (0, 1, 2)");

            migrationBuilder.AddCheckConstraint(
                name: "ck_chat_messages_channel",
                table: "chat_messages",
                sql: "channel IN (0, 1)");

            migrationBuilder.AddCheckConstraint(
                name: "ck_chat_messages_role",
                table: "chat_messages",
                sql: "role IN (0, 1)");

            migrationBuilder.AddCheckConstraint(
                name: "ck_categories_color_code",
                table: "categories",
                sql: "color_code ~ '^#[0-9A-Fa-f]{6}$'");

            migrationBuilder.AddCheckConstraint(
                name: "ck_categories_kind",
                table: "categories",
                sql: "kind IN (0, 1)");

            migrationBuilder.AddCheckConstraint(
                name: "ck_budgets_limit_value",
                table: "budgets",
                sql: "limit_value >= 0");

            migrationBuilder.AddCheckConstraint(
                name: "ck_budgets_period_month",
                table: "budgets",
                sql: "period_month BETWEEN 1 AND 12");

            migrationBuilder.AddCheckConstraint(
                name: "ck_budgets_period_year",
                table: "budgets",
                sql: "period_year BETWEEN 2000 AND 2100");

            migrationBuilder.AddCheckConstraint(
                name: "ck_alerts_type",
                table: "alerts",
                sql: "type IN (0, 1, 2)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_users_currency",
                table: "users");

            migrationBuilder.DropCheckConstraint(
                name: "ck_users_cycle_start_day",
                table: "users");

            migrationBuilder.DropCheckConstraint(
                name: "ck_users_email_minusculo",
                table: "users");

            migrationBuilder.DropCheckConstraint(
                name: "ck_users_monthly_ceiling",
                table: "users");

            migrationBuilder.DropCheckConstraint(
                name: "ck_transactions_payment_method",
                table: "transactions");

            migrationBuilder.DropCheckConstraint(
                name: "ck_transactions_source",
                table: "transactions");

            migrationBuilder.DropCheckConstraint(
                name: "ck_transactions_status",
                table: "transactions");

            migrationBuilder.DropCheckConstraint(
                name: "ck_transactions_type",
                table: "transactions");

            migrationBuilder.DropCheckConstraint(
                name: "ck_transactions_value",
                table: "transactions");

            migrationBuilder.DropCheckConstraint(
                name: "ck_otp_codes_attempts",
                table: "otp_codes");

            migrationBuilder.DropCheckConstraint(
                name: "ck_import_batches_status",
                table: "import_batches");

            migrationBuilder.DropCheckConstraint(
                name: "ck_chat_messages_channel",
                table: "chat_messages");

            migrationBuilder.DropCheckConstraint(
                name: "ck_chat_messages_role",
                table: "chat_messages");

            migrationBuilder.DropCheckConstraint(
                name: "ck_categories_color_code",
                table: "categories");

            migrationBuilder.DropCheckConstraint(
                name: "ck_categories_kind",
                table: "categories");

            migrationBuilder.DropCheckConstraint(
                name: "ck_budgets_limit_value",
                table: "budgets");

            migrationBuilder.DropCheckConstraint(
                name: "ck_budgets_period_month",
                table: "budgets");

            migrationBuilder.DropCheckConstraint(
                name: "ck_budgets_period_year",
                table: "budgets");

            migrationBuilder.DropCheckConstraint(
                name: "ck_alerts_type",
                table: "alerts");

            migrationBuilder.AlterTable(
                name: "users",
                oldComment: "Contas de acesso da plataforma (web, PWA e WhatsApp).");

            migrationBuilder.AlterTable(
                name: "transactions",
                oldComment: "Lancamentos financeiros unificados (receitas e despesas).");

            migrationBuilder.AlterTable(
                name: "otp_codes",
                oldComment: "Codigos de verificacao enviados por WhatsApp (armazenados como hash).");

            migrationBuilder.AlterTable(
                name: "import_batches",
                oldComment: "Lotes de importacao de extratos bancarios (OFX, CSV, XLSX).");

            migrationBuilder.AlterTable(
                name: "chat_messages",
                oldComment: "Historico de conversas com o assistente de IA.");

            migrationBuilder.AlterTable(
                name: "categories",
                oldComment: "Categorias de receitas e despesas, isoladas por usuario.");

            migrationBuilder.AlterTable(
                name: "budgets",
                oldComment: "Teto de gastos por categoria em um mes/ano.");

            migrationBuilder.AlterTable(
                name: "alerts",
                oldComment: "Alertas de orcamento exibidos na central de notificacoes.");

            migrationBuilder.AlterColumn<DateTime>(
                name: "updated_at",
                table: "users",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.AlterColumn<DateTime>(
                name: "onboarding_completed_at",
                table: "users",
                type: "timestamp without time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldNullable: true,
                oldComment: "Conclusao do fluxo de primeiro acesso; nulo enquanto pendente.");

            migrationBuilder.AlterColumn<decimal>(
                name: "monthly_ceiling",
                table: "users",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)",
                oldPrecision: 18,
                oldScale: 2,
                oldComment: "Teto global de gastos do mes definido no onboarding (R$).");

            migrationBuilder.AlterColumn<int>(
                name: "cycle_start_day",
                table: "users",
                type: "integer",
                nullable: false,
                defaultValue: 1,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 1,
                oldComment: "Dia do mes em que o ciclo financeiro do usuario comeca (1 a 28).");

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "users",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.AlterColumn<DateTime>(
                name: "updated_at",
                table: "transactions",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.AlterColumn<int>(
                name: "type",
                table: "transactions",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldComment: "0 = Despesa, 1 = Receita.");

            migrationBuilder.AlterColumn<int>(
                name: "status",
                table: "transactions",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldComment: "0 = Ativa, 1 = Cancelada.");

            migrationBuilder.AlterColumn<int>(
                name: "source",
                table: "transactions",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldComment: "Origem: 0 = Manual, 1 = Importacao de extrato, 2 = Assistente de IA.");

            migrationBuilder.AlterColumn<int>(
                name: "payment_method",
                table: "transactions",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true,
                oldComment: "0 = Cartao, 1 = Pix, 2 = Boleto, 3 = Debito, 4 = Dinheiro, 5 = Transferencia, 6 = Outro.");

            migrationBuilder.AlterColumn<string>(
                name: "external_id",
                table: "transactions",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100,
                oldNullable: true,
                oldComment: "Identificador do lancamento no extrato importado (deduplicacao).");

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "transactions",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "otp_codes",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.AlterColumn<int>(
                name: "status",
                table: "import_batches",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldComment: "0 = Pendente, 1 = Confirmado, 2 = Falhou.");

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "import_batches",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.AlterColumn<int>(
                name: "role",
                table: "chat_messages",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldComment: "0 = Usuario, 1 = Assistente.");

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "chat_messages",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.AlterColumn<int>(
                name: "channel",
                table: "chat_messages",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 0,
                oldComment: "0 = Web/PWA, 1 = WhatsApp.");

            migrationBuilder.AlterColumn<DateTime>(
                name: "updated_at",
                table: "categories",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.AlterColumn<int>(
                name: "kind",
                table: "categories",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldComment: "0 = Despesa, 1 = Receita.");

            migrationBuilder.AlterColumn<bool>(
                name: "is_system",
                table: "categories",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldComment: "Categoria clonada do modelo padrao no cadastro.");

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "categories",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.AlterColumn<DateTime>(
                name: "updated_at",
                table: "budgets",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.AlterColumn<decimal>(
                name: "limit_value",
                table: "budgets",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)",
                oldPrecision: 18,
                oldScale: 2,
                oldComment: "Valor maximo planejado para a categoria no periodo (R$).");

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "budgets",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.AlterColumn<DateTime>(
                name: "updated_at",
                table: "alerts",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.AlterColumn<int>(
                name: "type",
                table: "alerts",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldComment: "0 = Teto excedido, 1 = Limite de atencao (80%), 2 = Gasto elevado.");

            migrationBuilder.AlterColumn<string>(
                name: "dedup_key",
                table: "alerts",
                type: "character varying(60)",
                maxLength: 60,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(60)",
                oldMaxLength: 60,
                oldComment: "Chave unica por usuario que impede alertas duplicados (cat:{id}:{ano}-{mes}:{tipo}).");

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "alerts",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldDefaultValueSql: "now()");
        }
    }
}
