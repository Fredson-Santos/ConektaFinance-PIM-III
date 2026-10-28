using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PIM_III_Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUserOnboardingCompletedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "OnboardingCompletedAt",
                table: "Users",
                type: "TEXT",
                nullable: true);

            // Usuarios ja configurados (nome real e teto definido) nao devem passar pelo onboarding.
            migrationBuilder.Sql(
                "UPDATE \"Users\" SET \"OnboardingCompletedAt\" = \"CreatedAt\" " +
                "WHERE \"MonthlyCeiling\" > 0 AND \"FullName\" NOT LIKE 'Contato %';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OnboardingCompletedAt",
                table: "Users");
        }
    }
}
