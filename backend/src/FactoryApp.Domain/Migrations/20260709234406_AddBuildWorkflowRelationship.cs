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
            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = 'dbo'
                    AND TABLE_NAME = 'WorkflowHistory'
                    AND COLUMN_NAME = 'BuildId'
                )
                BEGIN
                    ALTER TABLE [dbo].[WorkflowHistory]
                    ADD [BuildId] [uniqueidentifier] NULL;
                END

                IF NOT EXISTS (
                    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = 'dbo'
                    AND TABLE_NAME = 'Builds'
                    AND COLUMN_NAME = 'WorkflowInstanceId'
                )
                BEGIN
                    ALTER TABLE [dbo].[Builds]
                    ADD [WorkflowInstanceId] [uniqueidentifier] NULL;
                END

                IF NOT EXISTS (
                    SELECT 1 FROM sys.indexes
                    WHERE name = 'IX_WorkflowHistory_BuildId'
                )
                BEGIN
                    CREATE INDEX IX_WorkflowHistory_BuildId ON [dbo].[WorkflowHistory]([BuildId]);
                END

                IF NOT EXISTS (
                    SELECT 1 FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
                    WHERE CONSTRAINT_NAME = 'FK_WorkflowHistory_Builds_BuildId'
                )
                BEGIN
                    ALTER TABLE [dbo].[WorkflowHistory]
                    ADD CONSTRAINT FK_WorkflowHistory_Builds_BuildId
                    FOREIGN KEY ([BuildId]) REFERENCES [dbo].[Builds]([Id]);
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF EXISTS (
                    SELECT 1 FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
                    WHERE CONSTRAINT_NAME = 'FK_WorkflowHistory_Builds_BuildId'
                )
                BEGIN
                    ALTER TABLE [dbo].[WorkflowHistory]
                    DROP CONSTRAINT FK_WorkflowHistory_Builds_BuildId;
                END

                IF EXISTS (
                    SELECT 1 FROM sys.indexes
                    WHERE name = 'IX_WorkflowHistory_BuildId'
                )
                BEGIN
                    DROP INDEX IX_WorkflowHistory_BuildId ON [dbo].[WorkflowHistory];
                END

                IF EXISTS (
                    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = 'dbo'
                    AND TABLE_NAME = 'WorkflowHistory'
                    AND COLUMN_NAME = 'BuildId'
                )
                BEGIN
                    ALTER TABLE [dbo].[WorkflowHistory]
                    DROP COLUMN [BuildId];
                END

                IF EXISTS (
                    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = 'dbo'
                    AND TABLE_NAME = 'Builds'
                    AND COLUMN_NAME = 'WorkflowInstanceId'
                )
                BEGIN
                    ALTER TABLE [dbo].[Builds]
                    DROP COLUMN [WorkflowInstanceId];
                END
            ");
        }
    }
}
