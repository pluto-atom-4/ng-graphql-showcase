---
applies_to:
  - "backend/src/**/*Migration*.cs"
  - "backend/**/*.sql"
  - "**/*DbContext*.cs"
autoload: onEdit
priority: high
---

# Database Rules (EF Core, Dapper, SQL Server)

**Reference**: [.claude/rules/database-rules.md](../../.claude/rules/database-rules.md)

## Quick Rules

| Rule             | Enforcement                                                                     |
| ---------------- | ------------------------------------------------------------------------------- |
| **Transactions** | EF Core + Dapper same op → Share explicit `DbTransaction` (CRITICAL)            |
| **Testing**      | Real SQL Server, never mocks. Test database auto-created per run.               |
| **Indexes**      | Foreign keys + Status/CreatedAt columns must have SQL indexes.                  |
| **Migrations**   | Use `dotnet ef migrations add` from WebApi. Test against real database.         |
| **EF Core**      | Set `QueryTrackingBehavior.NoTracking`. Use `ProjectTo<DTO>()` for projections. |

## CRITICAL: Shared Transaction Pattern

**When EF Core + Dapper in same operation, deadlocks occur if transactions aren't shared:**

```csharp
// ❌ Bad (causes deadlock)
var build = await context.Builds.FirstAsync();
await connection.ExecuteAsync("INSERT INTO Telemetry...");

// ✅ Good (safe)
using var tx = await context.Database.BeginTransactionAsync();
var build = await context.Builds.FirstAsync();
await connection.ExecuteAsync("INSERT INTO Telemetry...", transaction: tx);
await tx.CommitAsync();
```

## Integration Test Connection

```
Server=localhost,1433;Database=FactoryAppDb_Test;User Id=sa;Password=P@ssw0rd1234!;TrustServerCertificate=true;
```

**Prerequisites**: `pnpm docker:up` (SQL Server container running on port 1433)

Test database auto-created per run in `FactoryAppDb_Test_*` namespace. Auto-cleanup on dispose.

## Best Practices

- **NoTracking by default**: `context.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking`
- **Projections**: `.ProjectTo<DTO>(mapper.ConfigurationProvider)` (SELECT only needed columns)
- **DataLoaders**: Prevent N+1 queries on child entities
- **Dapper**: Telemetry only (never domain queries)

## Essential Commands

```bash
dotnet ef migrations add MigrationName         # From WebApi project
dotnet ef database update                      # Apply migrations
dotnet test backend/src                        # Real-DB integration tests
pnpm docker:up                                 # Start SQL Server container
```
