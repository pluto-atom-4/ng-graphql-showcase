using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FactoryApp.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddRoleAndClaimsToAuthUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = 'dbo'
                    AND TABLE_NAME = 'AuthUsers'
                    AND COLUMN_NAME = 'Claims'
                )
                BEGIN
                    ALTER TABLE [dbo].[AuthUsers]
                    ADD [Claims] [nvarchar](2000) NOT NULL DEFAULT N'';
                END

                IF NOT EXISTS (
                    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = 'dbo'
                    AND TABLE_NAME = 'AuthUsers'
                    AND COLUMN_NAME = 'Role'
                )
                BEGIN
                    ALTER TABLE [dbo].[AuthUsers]
                    ADD [Role] [int] NOT NULL DEFAULT 0;
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF EXISTS (
                    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = 'dbo'
                    AND TABLE_NAME = 'AuthUsers'
                    AND COLUMN_NAME = 'Claims'
                )
                BEGIN
                    ALTER TABLE [dbo].[AuthUsers]
                    DROP COLUMN [Claims];
                END

                IF EXISTS (
                    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = 'dbo'
                    AND TABLE_NAME = 'AuthUsers'
                    AND COLUMN_NAME = 'Role'
                )
                BEGIN
                    ALTER TABLE [dbo].[AuthUsers]
                    DROP COLUMN [Role];
                END
            ");
        }
    }
}
