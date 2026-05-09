using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace PIM_III_Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SeedCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "ColorCode", "CreatedAt", "Description", "Icon", "Name" },
                values: new object[,]
                {
                    { 1, "#FF5733", new DateTime(2026, 5, 9, 0, 0, 0, 0, DateTimeKind.Utc), "Restaurantes, supermercados, etc.", "restaurant", "Alimentação" },
                    { 2, "#33FF57", new DateTime(2026, 5, 9, 0, 0, 0, 0, DateTimeKind.Utc), "Combustível, passagens, apps de transporte", "directions_car", "Transporte" },
                    { 3, "#3357FF", new DateTime(2026, 5, 9, 0, 0, 0, 0, DateTimeKind.Utc), "Cinema, viagens, hobbies", "movie", "Lazer" },
                    { 4, "#FF33F1", new DateTime(2026, 5, 9, 0, 0, 0, 0, DateTimeKind.Utc), "Farmácia, consultas, exames", "medical_services", "Saúde" },
                    { 5, "#33FFF6", new DateTime(2026, 5, 9, 0, 0, 0, 0, DateTimeKind.Utc), "Cursos, mensalidades, livros", "school", "Educação" },
                    { 6, "#FFC300", new DateTime(2026, 5, 9, 0, 0, 0, 0, DateTimeKind.Utc), "Aluguel, contas de luz/água, manutenção", "home", "Moradia" },
                    { 7, "#900C3F", new DateTime(2026, 5, 9, 0, 0, 0, 0, DateTimeKind.Utc), "Gastos diversos", "more_horiz", "Outros" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 7);
        }
    }
}
