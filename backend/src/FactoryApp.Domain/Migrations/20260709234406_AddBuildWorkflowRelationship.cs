using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FactoryApp.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddBuildWorkflowRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "BuildId",
                schema: "dbo",
                table: "WorkflowHistory",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "WorkflowInstanceId",
                schema: "dbo",
                table: "Builds",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowHistory_BuildId",
                schema: "dbo",
                table: "WorkflowHistory",
                column: "BuildId");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkflowHistory_Builds_BuildId",
                schema: "dbo",
                table: "WorkflowHistory",
                column: "BuildId",
                principalSchema: "dbo",
                principalTable: "Builds",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkflowHistory_Builds_BuildId",
                schema: "dbo",
                table: "WorkflowHistory");

            migrationBuilder.DropIndex(
                name: "IX_WorkflowHistory_BuildId",
                schema: "dbo",
                table: "WorkflowHistory");

            migrationBuilder.DropColumn(
                name: "BuildId",
                schema: "dbo",
                table: "WorkflowHistory");

            migrationBuilder.DropColumn(
                name: "WorkflowInstanceId",
                schema: "dbo",
                table: "Builds");
        }
    }
}
