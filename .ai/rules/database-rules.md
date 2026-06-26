# Database Rules & Patterns

## Shared Transaction Rule (Critical)

EF Core + Dapper writes in same operation **must** share an explicit `DbTransaction`. Forgetting causes factory-floor deadlocks.

```csharp
using var transaction = await context.Database.BeginTransactionAsync();
// EF Core ops...
// Dapper ops (pass transaction)...
await transaction.CommitAsync();
```

## Integration Test Connection String

```
Server=localhost,1433;Database=FactoryAppDb_Test;User Id=sa;Password=P@ssw0rd1234!;TrustServerCertificate=true;
```

**Prerequisites**: `pnpm docker:up` (SQL Server container must be running)

## Database Testing Strategy

- Use real SQL Server (docker-compose) for integration tests, NOT mocks
- Avoid mocking DbContext; test actual EF Core + SQL Server behavior
- Transaction tests verify atomicity against real database engine
- Auto-created per test run in `FactoryAppDb_Test_*` namespace
- Each test gets dedicated database; auto-cleanup on dispose
- FixtureSeeder auto-runs; deterministic test GUIDs for repeatability

## EF Core Best Practices

- Set `QueryTrackingBehavior.NoTracking` by default
- Use `[UseProjection]` on resolvers to optimize SELECT columns
- Add DataLoaders for child entities (Build → Parts → TestRuns) to prevent N+1 queries
- Foreign keys + Status/CreatedAt columns must have SQL indexes

## Dapper Usage

Dapper reserved for:

- High-velocity telemetry writes only
- Never for domain queries (use EF Core)
- Must share transaction with EF Core when in same operation
