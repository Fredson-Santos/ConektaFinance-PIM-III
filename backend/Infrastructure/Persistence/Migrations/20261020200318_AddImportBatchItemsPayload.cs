using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PIM_III_Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddImportBatchItemsPayload : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ItemsJson",
                table: "ImportBatches",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ItemsJson",
                table: "ImportBatches");
        }
    }
}
