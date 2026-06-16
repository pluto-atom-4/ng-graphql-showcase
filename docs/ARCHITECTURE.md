# Architecture Guide

Detailed breakdown of the monorepo's design patterns and layers.

---

## System Architecture

```
┌──────────────────────────────────────────────┐
│         Angular UI (Apollo / Urql)           │  Real-time GraphQL
└──────────────────────┬───────────────────────┘  subscriptions via
                       │ ▲                        WebSockets / SSE
  GraphQL Mutations    │ │
                       ▼ │
┌──────────────────────────────────────────────┐
│        Hot Chocolate GraphQL Gateway         │  Auto-emits schema.graphql
│  (Projections, DataLoaders, Subscriptions)   │  on backend build
└──────────────────────┬───────────────────────┘
                       │
        Enforces Type  │ Executes Commands
        Safety         ▼ & Queries
┌──────────────────────────────────────────────┐
│        ASP.NET Core Service Layer            │  Domain logic,
│  (Scoped services, mutation handlers)        │  Elsa integration
└──────────┬────────────────┬──────────────────┘
           │                │
Domain &   │                │ High-frequency
Elsa State │                │ telemetry
Tracking   ▼                ▼
┌──────────────────────┐┌──────────────────────┐
│   Entity Framework   ││   Dapper Engine      │  Shared
│   Core Context       ││   (Raw SQL strings)  │  SqlTransaction
│ (NoTracking reads)   ││   (Batch inserts)    │
└──────────┬───────────┘└───────┬──────────────┘
           │                    │
           └────────┬───────────┘
                    ▼
┌──────────────────────────────────────────────┐
│        Microsoft SQL Server                  │  Transactional
│  (Domain Tables + Elsa WorkflowInstances)    │  ACID integrity
└──────────────────────────────────────────────┘
```

---

## Key Architecture Patterns

### 1. End-to-End Type Safety Pipeline

The build system automatically synchronizes types across all layers:

1. **Backend Build** → `dotnet build ./backend/FactoryApp.slnx`
2. **Schema Export** → Hot Chocolate emits `schema.graphql` (MSBuild target)
3. **Frontend Code-Gen** → GraphQL Code Generator reads schema
4. **Type-Safe Services** → Outputs `src/app/api/generated/graphql.ts`

**Workflow:**

- Modify a C# entity property (e.g., `Build.Priority: int`)
- Run `dotnet build` → schema updates
- Frontend file-watcher detects schema change → runs `pnpm codegen`
- Angular services update with new field
- IDE shows compile errors if queries reference removed fields

**Result:** No manual DTO/interface writing. Types flow automatically from C# → TypeScript.

### 2. Separation of Concerns (Data Access)

The monorepo uses a **hybrid data engine** to balance developer velocity and performance:

| Layer                     | Technology               | Use Case                                        | Tracking       | Transaction |
| ------------------------- | ------------------------ | ----------------------------------------------- | -------------- | ----------- |
| **Reads (GraphQL)**       | EF Core + Projections    | Domain queries with optimized SELECT            | NoTracking     | Implicit    |
| **Domain Mutations**      | EF Core                  | Add/update core entities (Build, Part, TestRun) | Change-tracked | Explicit    |
| **High-Frequency Writes** | Dapper                   | Telemetry, metrics, batch inserts from machines | None           | Shared      |
| **Both Together**         | Explicit `DbTransaction` | Atomic multi-step ops (domain + metrics)        | Mixed          | Explicit    |

**When to use EF Core:**

- Schema migrations
- Domain entity reads/writes
- Elsa workflow persistence
- Complex relationships (Build → Parts → TestRuns)

**When to use Dapper:**

- High-velocity telemetry ingestion
- Batch inserts (1000s of rows/sec from factory sensors)
- Circumvent change-tracking overhead
- Direct SQL for performance-critical paths

**Shared Transaction Pattern:**

```csharp
using var transaction = await context.Database.BeginTransactionAsync();
var dbConnection = context.Database.GetDbConnection();
var dbTransaction = context.Database.CurrentTransaction?.GetDbTransaction();

// EF Core: update Build status
var build = await context.Builds.FindAsync(buildId);
build.Status = BuildStatus.Complete;
await context.SaveChangesAsync();

// Dapper: log metrics (shares transaction)
using (var cmd = dbConnection.CreateCommand())
{
    cmd.CommandText = "INSERT INTO Metrics (BuildId, Duration) VALUES (@BuildId, @Duration)";
    cmd.Parameters.AddWithValue("@BuildId", buildId);
    cmd.Parameters.AddWithValue("@Duration", elapsed);
    cmd.Transaction = dbTransaction;
    await cmd.ExecuteNonQueryAsync();
}

await transaction.CommitAsync();
```

Forgetting the explicit transaction causes **deadlocks** under high load.

### 3. Hot Chocolate GraphQL Best Practices

#### Projections ([UseProjection])

Automatically translates Angular's GraphQL field selections to optimized SQL `SELECT` columns:

```csharp
[GraphQLType("Build")]
public partial class BuildType
{
    [UseProjection]  // ← Enables field selection optimization
    [UseFiltering]
    [UseSorting]
    public IQueryable<Build> GetBuilds(
        [Service] FactoryDbContext context)
        => context.Builds.AsNoTracking();
}
```

**Result:** If the frontend queries only `{ builds { id, name } }`, EF Core generates:

```sql
SELECT [Id], [Name] FROM [dbo].[Builds]
```

Not:

```sql
SELECT [Id], [Name], [Description], [Status], [CreatedAt], [UpdatedAt] FROM [dbo].[Builds]
```

#### DataLoaders

Batch child-entity queries to prevent N+1 database hits:

```csharp
[DataLoader("GetPartsForBuild")]
public async Task<IReadOnlyDictionary<Guid, List<Part>>> GetPartsForBuild(
    IReadOnlyList<Guid> buildIds,
    [Service] FactoryDbContext context,
    CancellationToken ct)
    => await context.Parts
        .Where(p => buildIds.Contains(p.BuildId))
        .AsNoTracking()
        .GroupBy(p => p.BuildId)
        .ToDictionaryAsync(g => g.Key, g => g.ToList(), ct);
```

**Usage in resolver:**

```csharp
public class BuildType
{
    public async Task<List<Part>> GetParts(
        Build build,
        [DataLoader("GetPartsForBuild")] IDataLoader<Guid, List<Part>> loader)
        => await loader.LoadAsync(build.Id);
}
```

#### Query Depth Limits

Hot Chocolate enforces max nesting depth of **5 layers**. Avoid:

```graphql
Build {
  Parts {
    TestRuns {
      Logs {
        Metrics {
          Details  # ← Layer 5: CATASTROPHIC N+1
        }
      }
    }
  }
}
```

Use DataLoaders + separate requests instead.

#### NoTracking Queries

All GraphQL queries use `QueryTrackingBehavior.NoTracking` for dashboard performance:

```csharp
var builds = await context.Builds
    .AsNoTracking()  // ← No change tracking overhead
    .Where(b => b.Status == BuildStatus.Running)
    .ToListAsync();
```

### 4. Elsa Workflow v3 Integration

Long-running manufacturing workflows (e.g., "Build → Verify Parts → Run Tests → Complete") are orchestrated via Elsa Workflows:

**Activities** (C# code representing workflow steps):

```csharp
[Activity(
    Category = "Manufacturing",
    DisplayName = "Verify Parts Allocated",
    Description = "Check if all parts for a build are in stock")]
public class VerifyPartsAllocatedActivity : CodeActivity
{
    [ActivityInput(Hint = "The Build ID")]
    public string BuildId { get; set; }

    [ActivityOutput]
    public bool AllPartsAllocated { get; set; }

    protected override void Execute(ActivityExecutionContext context)
    {
        // 1. Fetch fresh domain state using BuildId
        var build = _buildService.GetBuild(BuildId);

        // 2. Check inventory
        AllPartsAllocated = _inventoryService.CanAllocate(build.Parts);

        // 3. Publish event → Hot Chocolate broadcasts to Angular
        if (AllPartsAllocated)
            _eventPublisher.PublishAsync(new PartsAllocatedEvent { BuildId });
    }
}
```

**State Storage Rule:**

Store **only primitive keys** in workflow variables. On activity resume, fetch fresh domain data:

```csharp
// ✅ CORRECT: Store only the key
var buildId = context.GetInput<Guid>("buildId");
var build = await _context.Builds.FindAsync(buildId);

// ❌ WRONG: Don't store the entire entity
context.SetVariable("build", build); // Will break if schema changes
```

This isolates active workflows from schema updates. Versioning allows old workflows to complete naturally while new builds use the latest version.

### 5. Angular Real-Time Updates

Frontend consumes Hot Chocolate subscriptions via RxJS:

```typescript
export class BuildMonitorComponent implements OnInit {
  builds$: Observable<Build[]>;

  constructor(private buildService: BuildService) {}

  ngOnInit() {
    this.builds$ = this.buildService.streamBuildUpdates().pipe(
      bufferTime(250), // Batch updates (prevents UI thrashing)
      switchMap((updates) => this.dedup(updates)),
    );
  }
}

@Component({
  selector: "app-build-row",
  changeDetection: ChangeDetectionStrategy.OnPush, // ← Explicit detection only
  template: ` <div *ngFor="let build of builds; trackBy: trackByBuildId">
    {{ build.name }}
  </div>`,
})
export class BuildRowComponent {
  @Input() builds: Build[];

  trackByBuildId(index: number, build: Build) {
    return build.id; // ← Explicit trackBy (essential for performance)
  }
}
```

**Patterns:**

- `bufferTime(250)`: Batches high-frequency telemetry (prevents 1000 UI updates/sec)
- `ChangeDetectionStrategy.OnPush`: Only update when inputs change
- `trackBy` functions: Prevent unnecessary DOM reflows

---

## Folder Structure

```
backend/src/
├── FactoryApp.WebApi/
│   ├── Program.cs                 (Hot Chocolate setup, EF config, Elsa bootstrap)
│   ├── schema.graphql             (AUTO-GENERATED; commit to repo)
│   └── FactoryApp.WebApi.csproj   (MSBuild targets for schema export)
├── FactoryApp.Domain/
│   ├── Entities/
│   │   ├── Build.cs               (Aggregate root: Build, Parts, TestRuns)
│   │   ├── Part.cs                (Component entity)
│   │   ├── TestRun.cs             (Child entity)
│   │   └── AuthUser.cs            (Authentication)
│   ├── Migrations/                (EF Core auto-generated migrations)
│   └── FactoryDbContext.cs        (DbContext with NoTracking default)
├── FactoryApp.GraphQL/
│   ├── Queries/                   (GraphQL query resolvers)
│   ├── Mutations/                 (GraphQL mutation resolvers)
│   ├── Types/                     (Hot Chocolate type definitions)
│   └── DataLoaders/               (Batch query loaders)
├── FactoryApp.Workflows/
│   ├── Activities/                (Elsa custom activities)
│   └── WorkflowDefinitions/       (Long-running workflow orchestrations)
└── FactoryApp.sln                 (OLD; use FactoryApp.slnx instead)

frontend/src/app/
├── graphql/                       (GraphQL operation files: *.graphql)
│   ├── BuildQuery.graphql
│   ├── CreateBuildMutation.graphql
│   └── SubscribeBuildUpdates.graphql
├── api/generated/
│   └── graphql.ts                 (AUTO-GENERATED type-safe services)
└── components/
    ├── smart/                     (Container components: data fetching)
    └── dumb/                       (Presentation components: pure input/output)
```

---

## Critical Constraints

1. **Schema.graphql is Generated**
   - Never edit manually
   - Always commit to repo
   - Triggers frontend codegen on change

2. **No Direct Entity Exposure**
   - Map EF entities to DTOs in GraphQL resolvers
   - Decouples schema evolution from database

3. **Elsa State Isolation**
   - Store primitives only (Guid, string, int)
   - Fetch fresh domain state on activity execution
   - Prevents schema-update breakage

4. **Transaction Atomicity**
   - EF Core + Dapper in same operation = shared `DbTransaction`
   - Else: deadlocks, race conditions

5. **Query Depth**
   - Max 5 layers of nesting
   - Use DataLoaders + separate requests for deep traversals

---

## Performance Optimization

### Query Layer

- `[UseProjection]` → optimized SELECT columns
- DataLoaders → batch queries
- `AsNoTracking()` → no change-tracking overhead
- Indexes on FK + Status/CreatedAt

### UI Layer

- `ChangeDetectionStrategy.OnPush` → explicit detection only
- `trackBy` functions → prevent DOM reflows
- `bufferTime(250)` → batch high-frequency updates

### Data Layer

- Dapper → telemetry writes (bypass ORM)
- Shared transactions → atomic ops
- Batch inserts → 1000s rows/sec

---

## References

- **README.md** — Quickstart and troubleshooting
- **docs/DATABASE.md** — Migrations, schema management
- **docs/DEVELOPMENT.md** — IDE setup, debugging
