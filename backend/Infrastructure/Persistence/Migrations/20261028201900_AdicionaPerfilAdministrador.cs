using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PIM_III_Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AdicionaPerfilAdministrador : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "account_type",
                table: "users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Standard",
                comment: "Perfil de acesso: Standard (usuario) ou Admin (painel administrativo).",
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldDefaultValue: "Standard");

            migrationBuilder.AddColumn<bool>(
                name: "is_active",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: true,
                comment: "Contas desativadas pelo administrador nao conseguem autenticar.");

            migrationBuilder.AddCheckConstraint(
                name: "ck_users_account_type",
                table: "users",
                sql: "account_type IN ('Standard', 'Admin')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_users_account_type",
                table: "users");

            migrationBuilder.DropColumn(
                name: "is_active",
                table: "users");

            migrationBuilder.AlterColumn<string>(
                name: "account_type",
                table: "users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Standard",
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldDefaultValue: "Standard",
                oldComment: "Perfil de acesso: Standard (usuario) ou Admin (painel administrativo).");
        }
    }
}
