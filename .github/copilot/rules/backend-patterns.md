---
applies_to:
  - "backend/src/**/*.cs"
  - "backend/**/*.csproj"
autoload: onEdit
priority: high
---

# Backend Patterns (ASP.NET Core .NET 10)

**Reference**: [.claude/rules/backend-patterns.md](../../.claude/rules/backend-patterns.md)

## Quick Rules

| Rule            | Enforcement                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| **Data Access** | Hybrid: EF Core (reads) + Dapper (telemetry writes). Share DbTransaction when both in same operation.   |
| **Testing**     | Real SQL Server (not mocks). Integration tests vs `localhost,1433`. Database auto-created per test run. |
| **Projections** | Use `[UseProjection]` on resolvers. Apply `.ProjectTo<DTO>()` for column optimization.                  |
| **Migrations**  | `dotnet ef migrations add` from WebApi project. Always commit `schema.graphql` after entity changes.    |
| **Defaults**    | `QueryTrackingBehavior.NoTracking` on DbContext. Add indexes to FK + Status/CreatedAt columns.          |

## Critical Constraint

**EF Core + Dapper in same operation MUST share explicit `DbTransaction`:**

```csharp
using var transaction = await context.Database.BeginTransactionAsync();
// EF Core reads
var builds = await context.Builds.AsNoTracking().ToListAsync();
// Dapper telemetry writes (pass transaction)
await connection.ExecuteAsync("INSERT INTO Telemetry...", transaction: transaction);
await transaction.CommitAsync();
```

Forgetting this causes factory-floor deadlocks.

## Testing

- Always test against real SQL Server (Docker: `pnpm docker:up`)
- Never mock DbContext
- Connection: `Server=localhost,1433;Database=FactoryAppDb_Test;User Id=sa;Password=P@ssw0rd1234!;TrustServerCertificate=true;`

## Essential Commands

```bash
dotnet ef migrations add MigrationName    # From WebApi project
dotnet build backend/FactoryApp.slnx      # Emits schema.graphql
dotnet test backend/src                   # Integration tests
dotnet watch run                          # Dev with hot reload
```
