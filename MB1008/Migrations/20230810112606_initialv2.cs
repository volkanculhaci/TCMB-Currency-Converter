using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MB1008.Migrations
{
    public partial class initialv2 : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_Exchanges",
                table: "Exchanges");

            migrationBuilder.RenameTable(
                name: "Exchanges",
                newName: "ExchangeRates");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ExchangeRates",
                table: "ExchangeRates",
                column: "Id");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_ExchangeRates",
                table: "ExchangeRates");

            migrationBuilder.RenameTable(
                name: "ExchangeRates",
                newName: "Exchanges");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Exchanges",
                table: "Exchanges",
                column: "Id");
        }
    }
}
