using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FactoryApp.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkflowHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_SCHEMA = 'dbo'
                    AND TABLE_NAME = 'WorkflowHistory'
                )
                BEGIN
                    CREATE TABLE [dbo].[WorkflowHistory] (
                        [Id] [uniqueidentifier] NOT NULL,
                        [WorkflowInstanceId] [uniqueidentifier] NOT NULL,
                        [EventType] [nvarchar](max) NOT NULL,
                        [ActivityName] [nvarchar](max) NOT NULL,
                        [OldStatus] [nvarchar](max) NOT NULL,
                        [NewStatus] [nvarchar](max) NOT NULL,
                        [StateSnapshot] [nvarchar](max) NULL,
                        [ErrorMessage] [nvarchar](max) NULL,
                        [RecordedAt] [datetime2] NOT NULL,
                        [ExecutionStarted] [datetime2] NULL,
                        [ExecutionCompleted] [datetime2] NULL,
                        [ElapsedMilliseconds] [bigint] NULL,
                        CONSTRAINT [PK_WorkflowHistory] PRIMARY KEY CLUSTERED ([Id] ASC)
                    );

                    CREATE INDEX [IX_WorkflowHistory_WorkflowInstanceId] ON [dbo].[WorkflowHistory]([WorkflowInstanceId]);
                    CREATE INDEX [IX_WorkflowHistory_RecordedAt] ON [dbo].[WorkflowHistory]([RecordedAt]);
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF EXISTS (
                    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_SCHEMA = 'dbo'
                    AND TABLE_NAME = 'WorkflowHistory'
                )
                BEGIN
                    DROP TABLE [dbo].[WorkflowHistory];
                END
            ");
        }
    }
}
