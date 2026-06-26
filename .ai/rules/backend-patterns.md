# Backend Patterns (ASP.NET Core, EF Core, Dapper)

## Architecture Overview

- **Hybrid Data Access**: EF Core (reads, migrations) + Dapper (high-velocity telemetry writes)
- **Type Safety**: C# entities → schema.graphql → graphql.ts (automated pipeline)
- **Projections**: Use `[UseProjection]` on resolvers to optimize SQL SELECT columns
- **DataLoaders**: Prevent N+1 queries on related entities

## Testing Strategy

### Backend Tests

```bash
dotnet test backend/src
```

**Integration Tests** connect to docker-compose SQL Server (port 1433):

- Test database auto-created per run in `FactoryAppDb_Test_*` namespace
- Each test gets dedicated database; auto-cleanup on dispose
- FixtureSeeder auto-runs; deterministic test GUIDs for repeatability
- **Prerequisites**: `pnpm docker:up` (SQL Server container must be running)

### Never Mock DbContext

Test against real EF Core + SQL Server behavior:

- Transaction tests verify atomicity against real database engine
- Mocks diverge from production behavior
- Example past incident: mocked tests passed, prod migration failed

Use connection string:

```
Server=localhost,1433;Database=FactoryAppDb_Test;User Id=sa;Password=P@ssw0rd1234!;TrustServerCertificate=true;
```

## EF Core Best Practices

- **NoTracking by default**: Set `QueryTrackingBehavior.NoTracking` on DbContext
- **Projections**: Use `.ProjectTo<DTO>()` to select only needed columns
- **Indexes**: Foreign keys + Status/CreatedAt columns must have SQL indexes
- **Migrations**: Use `dotnet ef migrations add <Name>` from WebApi project
- **Commit schema**: Always commit `schema.graphql` after schema changes

## Dapper Usage (Telemetry Only)

Dapper reserved for high-velocity telemetry writes:

- Never use for domain queries (use EF Core)
- Must share DbTransaction with EF Core when in same operation
- See [[database-rules]] for transaction pattern

## ASP.NET Core Defaults

- Stack: .NET 10 (or 9 for .slnx support)
- Hot Chocolate GraphQL server (type-safe resolvers)
- Elsa Workflows v3 for orchestration
- SQL Server 2022 persistence

Essential commands:

```bash
cd backend/src/FactoryApp.WebApi
dotnet ef migrations add MyMigration
dotnet watch run        # Development with hot reload
dotnet build
dotnet test
```

See [[graphql-patterns]] for query depth and entity exposure rules.
