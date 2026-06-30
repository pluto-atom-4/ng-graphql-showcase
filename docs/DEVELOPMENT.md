# Development Workflow

Guide to local development, IDE setup, debugging, and common scenarios.

---

## Daily Workflow

### 1. Start Services

**Terminal 1: Backend (.NET)**

```bash
pnpm dev:backend
# Runs: cd backend/src/FactoryApp.WebApi && dotnet watch run
# Watches for code changes; auto-rebuilds and reloads
# Port 5000 → GraphQL endpoint at http://localhost:5000/graphql
```

**Terminal 2: Frontend (Angular)**

```bash
pnpm dev:frontend
# Runs: pnpm --filter frontend run ng serve
# HMR (Hot Module Replacement) enabled
# Port 4200 → UI at http://localhost:4200
```

**Or concurrently:**

```bash
pnpm dev
# Starts both in separate processes with concurrently
```

### 2. Modify Code

#### Backend Changes (C#)

```csharp
// backend/src/FactoryApp.Domain/Entities/Build.cs
public class Build
{
    // Add new property
    public int Priority { get; set; } = 0;
}
```

**Trigger:**

1. `dotnet build` auto-triggers via watch
2. Hot Chocolate emits updated `schema.graphql`
3. Frontend file-watcher detects schema change
4. GraphQL Code Generator runs → `graphql.ts` updates
5. Angular compiles with new types
6. IDE shows errors if queries reference old fields

#### Frontend Changes (TypeScript/HTML)

```typescript
// frontend/src/app/components/build-detail.component.ts
export class BuildDetailComponent implements OnInit {
  builds$ = this.buildService.getBuilds(); // Type-safe!
}
```

**Trigger:**

1. Code change saved
2. Angular dev server detects change
3. HMR updates the browser (no full page reload)

---

## Backend Configuration & Secrets

### Environment-Based Credentials

Backend reads sensitive configuration from environment variables (production-safe):

**SQL Server Credentials:**

```bash
# Set SA password for docker-compose SQL Server
export MSSQL_SA_PASSWORD="P@ssw0rd1234!"

# Overrides password in appsettings.Development.json
pnpm dev:backend  # Uses env var if present
```

**JWT Secret:**

```bash
# Set JWT signing key (must be ≥32 chars)
export JWT_SECRET="your-super-secret-key-min-32-chars-development!"

# Overrides Jwt:Secret in appsettings.Development.json
pnpm dev:backend
```

**Resolution Order (Priority):**

1. Environment variables (JWT_SECRET, MSSQL_SA_PASSWORD)
2. appsettings.Development.json (local config)
3. appsettings.json (defaults)

**Important:** appsettings.Development.json is in `.gitignore` and must never be committed.

### Local Setup

**Option 1: Using docker-compose (Recommended)**

```bash
pnpm docker:up        # Sets MSSQL_SA_PASSWORD automatically
pnpm dev:backend      # Backend reads env var
```

**Option 2: Manual configuration**

1. Copy template:

```bash
cp backend/src/FactoryApp.WebApi/appsettings.Development.example.json \
   backend/src/FactoryApp.WebApi/appsettings.Development.json
```

2. Edit with your credentials:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=FactoryDb;User Id=sa;Password=YOUR_PASSWORD;TrustServerCertificate=True"
  },
  "Jwt": {
    "Secret": "your-super-secret-key-min-32-chars-development!"
  }
}
```

3. Never commit this file (it's in `.gitignore`)

### CI/CD Integration

Set environment variables in your CI system:

- **GitHub Actions:** Secrets → `Settings > Secrets and variables`
- **Azure DevOps:** Pipelines → `Library > Secure files`
- **Docker:** `docker-compose.override.yml` or `--env-file`

Example (docker-compose.override.yml):

```yaml
services:
  sql-server:
    environment:
      MSSQL_SA_PASSWORD: ${MSSQL_SA_PASSWORD:-P@ssw0rd1234!}
```

---

## IDE Setup

### JetBrains Rider (Recommended)

**Why Rider:**

- Native C# debugging with breakpoints
- Integrated SQL Server Profiler (critical for Dapper tuning)
- Full-stack debugging (backend + network requests simultaneously)
- Hot Chocolate schema validation & autocomplete
- Elsa workflow visualization

**Setup:**

```bash
# Open project in Rider
open -a "Rider" .

# Or from command line
rider .
```

**Debugging:**

1. Place breakpoint in C# code (click line number)
2. Run backend via `pnpm dev:backend`
3. Execute action that hits breakpoint
4. Rider pauses execution; inspect variables, step through code
5. Open SQL Profiler window → see exact SQL queries executed

**Schema Validation:**

- Rider auto-validates GraphQL resolvers against schema
- Shows errors if resolver return type doesn't match schema definition

### VS Code

**Setup:**

1. Install extensions:
   - C#: C# Dev Kit (Microsoft)
   - C#: Omnisharp (jchannon)
   - GraphQL (Prisma)
   - Angular Language Service (Angular)

2. Open project:

```bash
code .
```

**Limitations:**

- C# debugging requires .NET CLI tools (limited vs. Rider)
- No integrated SQL profiler
- GraphQL schema validation less robust

---

## Backend Debugging

### Breakpoints

```csharp
// backend/src/FactoryApp.GraphQL/Queries/BuildQuery.cs
[GraphQLType("Build")]
public class BuildQuery
{
    public async Task<List<Build>> GetBuilds([Service] FactoryDbContext context)
    {
        // Place breakpoint here ↓
        var builds = await context.Builds.AsNoTracking().ToListAsync();
        return builds;
    }
}
```

1. Click line number in Rider to place breakpoint
2. Execute GraphQL query from frontend
3. Breakpoint pauses execution
4. Inspect `builds` list, context state, etc.

### SQL Query Inspection

In Rider's SQL Profiler:

1. Open **Tools** → **SQL Profiler**
2. Execute operation (e.g., load builds page)
3. See all SQL executed: selects, inserts, updates
4. Identify N+1 queries, missing indexes, etc.

### Common Debugging Scenarios

#### "Frontend type error: property X doesn't exist"

1. Check C# entity has property:

```csharp
// backend/src/FactoryApp.Domain/Entities/Build.cs
public string Priority { get; set; }  // ← Exists?
```

2. Verify Hot Chocolate exposes it:

```csharp
// backend/src/FactoryApp.GraphQL/Types/BuildType.cs
[GraphQLType("Build")]
public class BuildType
{
    // Doesn't explicitly filter properties; all are exposed by default
}
```

3. Rebuild backend:

```bash
dotnet build
```

4. Check `schema.graphql` includes new field:

```graphql
type Build {
  id: ID!
  name: String!
  priority: Int! # ← Should be here
}
```

5. Regenerate frontend types:

```bash
pnpm codegen
```

#### "N+1 query performance issue in Hot Chocolate"

**Symptom:** GraphQL resolver executes 100 queries instead of 1

**Causes:**

- Missing DataLoader
- Missing `[UseProjection]`
- Deeply nested queries (>5 layers)

**Investigation:**

1. Open SQL Profiler in Rider
2. Execute GraphQL query that's slow
3. Count number of queries; note the SELECT statements
4. Identify the pattern (e.g., per-row query)

**Solutions:**

Option 1: Add DataLoader

```csharp
[DataLoader("GetPartsByBuildId")]
public async Task<IReadOnlyDictionary<Guid, List<Part>>> GetPartsByBuildId(
    IReadOnlyList<Guid> buildIds,
    [Service] FactoryDbContext context)
    => await context.Parts
        .Where(p => buildIds.Contains(p.BuildId))
        .AsNoTracking()
        .GroupBy(p => p.BuildId)
        .ToDictionaryAsync(g => g.Key, g => g.ToList());
```

Option 2: Add [UseProjection]

```csharp
[UseProjection]
[UseSorting]
[UseFiltering]
public IQueryable<Build> GetBuilds([Service] FactoryDbContext context)
    => context.Builds.AsNoTracking();
```

Option 3: Flatten query structure

```graphql
# ✗ Bad (deeply nested)
{
  builds {
    parts {
      testRuns {
        logs {
          metrics {
            # ← Layer 5: N+1 explosion
            value
          }
        }
      }
    }
  }
}

# ✓ Good (separate requests)
# Query 1: builds + parts
# Query 2: testRuns for specific builds
# Query 3: logs for specific testRuns
```

#### "Deadlock when updating Build + logging metrics"

**Symptom:** `System.Data.SqlClient.SqlException: Deadlock detected`

**Cause:** EF Core and Dapper don't share transaction

**Fix:**

```csharp
// ✓ Correct: Share explicit transaction
using var transaction = await context.Database.BeginTransactionAsync();
var dbConnection = context.Database.GetDbConnection();
var dbTransaction = context.Database.CurrentTransaction?.GetDbTransaction();

// EF Core op
var build = await context.Builds.FindAsync(buildId);
build.Status = BuildStatus.Complete;
await context.SaveChangesAsync();

// Dapper op (shares transaction!)
using (var cmd = dbConnection.CreateCommand())
{
    cmd.CommandText = "INSERT INTO Metrics (BuildId) VALUES (@BuildId)";
    cmd.Parameters.AddWithValue("@BuildId", buildId);
    cmd.Transaction = dbTransaction;  // ← KEY
    await cmd.ExecuteNonQueryAsync();
}

await transaction.CommitAsync();
```

#### "Elsa workflow fails on resume after schema update"

**Symptom:** `InvalidOperationException: Column 'XXX' does not exist`

**Cause:** Activity stored entity object; schema changed; column was renamed/removed

**Fix:**

1. Verify activity stores only primitive keys:

```csharp
// ✓ Correct
var buildId = context.GetInput<Guid>("buildId");
var build = await _context.Builds.FindAsync(buildId);

// ✗ Wrong
context.SetVariable("build", build);  // Don't store entity
```

2. Deploy new workflow version
3. Let old versions complete naturally
4. Route new builds to latest version

---

## Frontend Debugging

### Angular DevTools

In Chrome/Edge:

1. Open DevTools (F12)
2. Go to **Angular** tab (if installed)
3. Inspect component tree, bindings, change detection

### RxJS Debugging

```typescript
// Use rxjs/operators to log observable emissions
import { tap, debug } from 'rxjs/operators';

export class BuildService {
  getBuilds() {
    return this.apollo.query({...})
      .pipe(
        tap(result => console.log('Query result:', result)),
        debug('Build Query')  // ← RxJS debug operator
      );
  }
}
```

### GraphQL Debugging

1. Navigate to `http://localhost:5000/graphql`
2. Use GraphQL Playground to test queries
3. Execute against live backend
4. See execution time, errors, response shape

---

## Testing Locally

### Backend Tests

```bash
# Run all backend tests
dotnet test backend/src

# Run specific test class
dotnet test backend/src --filter "TestClass=BuildRepositoryTests"

# Run with output
dotnet test backend/src --logger "console;verbosity=detailed"

# Prerequisites: SQL Server must be running
pnpm docker:up
```

### Backend Test Architecture

Tests use **real SQL Server** (never mocks). Each test gets isolated database with auto-cleanup.

#### Unit Tests (No DB)

For services without database dependencies:

```csharp
// backend/FactoryApp.Tests/AuthServiceTests.cs
public class AuthServiceTests
{
    [Fact]
    public void HashPassword_WithValidPassword_ReturnsHash()
    {
        var authService = new AuthService(config);
        var hash = authService.HashPassword("TestPass123!");
        Assert.NotNull(hash);
    }
}
```

Run: `dotnet test backend/FactoryApp.Tests --filter "TestClass=AuthServiceTests"`

#### Integration Tests (Real DB)

For GraphQL resolvers and mutations touching database:

```csharp
// backend/FactoryApp.Tests/BuildMutationTests.cs
public class BuildMutationTests : IAsyncLifetime
{
    private readonly TestDatabaseFixture _fixture = new();
    private FactoryDbContext _context = null!;

    public async Task InitializeAsync()
    {
        await _fixture.InitializeAsync();  // Creates isolated test DB
        _context = _fixture.GetContext();
    }

    public async Task DisposeAsync()
    {
        await _fixture.DisposeAsync();      // Drops test DB
    }

    [Fact]
    public async Task CreateBuild_WithValidInput_ReturnsBuildPayload()
    {
        // Test receives fresh DB, FixtureSeeder data
    }
}
```

**Key differences:**

- Uses `TestDatabaseFixture` (real SQL Server at localhost:1433)
- Implements `IAsyncLifetime` for setup/teardown
- Each test gets unique `FactoryAppDb_Test_*` database
- Database auto-dropped after test completes

#### Transaction Tests (Shared Fixture)

For testing atomicity and multi-operation consistency:

```csharp
// backend/FactoryApp.Tests/Mutations/TestRunTransactionTests.cs
[Collection("SQL Server Transaction Tests")]
public class TestRunTransactionTests
{
    private readonly TestDatabaseFixture _dbFixture;

    public TestRunTransactionTests(TestDatabaseFixture dbFixture)
    {
        _dbFixture = dbFixture;  // Shared across collection
    }

    [Fact]
    public async Task SubmitTestRun_RollsBackOnDatabaseError()
    {
        // Test against same seeded database as other tests in collection
    }
}
```

**Key differences:**

- Uses xUnit Collections (shared fixture across multiple tests)
- Defined in `FactoryApp.Tests/Collections/TransactionTestCollection.cs`
- Single database used for all tests in collection
- Useful for transaction/rollback scenarios

### Using Test Helpers

Fluent builder for cleaner test setup:

```csharp
// Setup
var ctx = new GraphQLTestBuilder()
    .WithContext(_context)
    .WithDefaults()
    .BuildMutationContext();

// Act
var result = await ctx.CreateBuild("Test Build", "Description");

// Assert
Assert.NotNull(result);
Assert.Equal("Test Build", result.Name);
```

**Available contexts:**

- `QueryTestContext`: Pre-wired query resolvers (GetBuild, GetBuilds, GetBuildsPaginated)
- `MutationTestContext`: Pre-wired mutation resolvers (CreateBuild, UpdateBuildStatus, AddPart, SubmitTestRun)

### Never Mock DbContext

Tests must use real SQL Server. Mock divergence causes production failures:

```csharp
// ❌ WRONG
var mockDbContext = new Mock<FactoryDbContext>();
mockDbContext.Setup(...).Returns(...);

// ✅ CORRECT
var fixture = new TestDatabaseFixture();
await fixture.InitializeAsync();
var context = fixture.GetContext();
```

### Frontend Tests

```bash
# Run all frontend tests
pnpm --filter frontend run test

# Run specific test file
pnpm --filter frontend run test BuildDetailComponent

# Run with coverage
pnpm --filter frontend run test:coverage
```

---

## Monorepo Build Steps

Understand what happens during full build:

```bash
pnpm build
```

**Order:**

1. Backend: Restore NuGet packages
2. Backend: Compile C# projects
3. Backend: MSBuild target emits `schema.graphql`
4. Frontend: Restore npm packages
5. Frontend: Run GraphQL Code Generator (reads `schema.graphql`)
6. Frontend: Compile Angular (TypeScript → JavaScript)
7. Frontend: Bundle with Vite/Webpack

**Result:** `dist/` contains deployable artifacts

---

## IDE Shortcuts (Rider)

| Shortcut         | Action                                       |
| ---------------- | -------------------------------------------- |
| Cmd/Ctrl+Shift+A | Search everything (code, settings, commands) |
| Cmd/Ctrl+Click   | Go to definition                             |
| Cmd/Ctrl+Shift+I | Show definition inline                       |
| Cmd/Ctrl+F12     | Show file structure                          |
| Cmd/Ctrl+Alt+L   | Reformat code                                |
| Cmd/Ctrl+/       | Toggle comment                               |
| F5               | Debug (run with breakpoints)                 |
| F9               | Toggle breakpoint                            |
| F10              | Step over                                    |
| F11              | Step into                                    |
| Shift+F11        | Step out                                     |

---

## References

- **README.md** — Quickstart commands
- **docs/ARCHITECTURE.md** — DataLoader patterns, Hot Chocolate best practices
- **docs/DATABASE.md** — EF Core migrations, SQL Server setup
