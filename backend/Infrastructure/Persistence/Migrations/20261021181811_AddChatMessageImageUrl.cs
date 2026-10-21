using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PIM_III_Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddChatMessageImageUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "ChatMessages",
                type: "TEXT",
                maxLength: 300,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "ChatMessages");
        }
    }
}
