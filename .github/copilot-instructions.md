# Copilot Instructions for ng-graphql-playground

This guide helps Copilot work effectively in this full-stack monorepo for managing long-running manufacturing workflows.

## Project Overview

**Type-safe full-stack monorepo** with:

- **Frontend**: Angular 19+ with Apollo/Urql (GraphQL clients)
- **API Gateway**: Hot Chocolate GraphQL (ChilliCream)
- **Backend**: ASP.NET Core (.NET 10)
- **Workflows**: Elsa Workflows v3 (long-running state machines)
- **Database**: Microsoft SQL Server
- **Data Access**: Hybrid EF Core (reads) + Dapper (high-velocity writes)

## Build, Test & Lint Commands

### Backend (.NET)

```bash
# Restore dependencies
dotnet restore backend/src

# Build & auto-emit GraphQL schema
dotnet build backend/FactoryApp.slnx

# Run database migrations
cd backend/src/FactoryApp.WebApi
dotnet ef database update

# Run backend server (watch mode)
dotnet watch run

# Run all backend tests
dotnet test backend/src

# Run single test file or specific test
dotnet test backend/src/FactoryApp.Tests/FactoryApp.Tests.csproj --filter "ClassName=TestClassName"
```

### Frontend (Angular)

```bash
# Install dependencies
pnpm install

# Generate type-safe services from GraphQL schema
pnpm --filter frontend run codegen

# Start Angular dev server (HMR enabled)
pnpm --filter frontend run ng serve

# Run all frontend tests
pnpm --filter frontend run test

# Run single test file
pnpm --filter frontend run test -- --include='**/component.spec.ts'

# Lint frontend code
pnpm --filter frontend run lint
```

### Monorepo (Root)

```bash
# Start both backend + frontend watchers concurrently
pnpm dev

# Build both stacks
pnpm build

# Run all tests (backend + frontend)
pnpm test

# Lint entire monorepo
pnpm lint
```

## Architecture Overview

```
┌──────────────────────────────────────────────┐
│         Angular UI (Apollo / Urql)           │  Real-time GraphQL
└──────────────────────┬───────────────────────┘  subscriptions via
                       │ ▲                        WebSockets / SSE
  GraphQL Queries      │ │
  & Mutations          ▼ │
┌──────────────────────────────────────────────┐
│        Hot Chocolate GraphQL Gateway         │  Auto-emits schema.graphql
│  (Projections, DataLoaders, Subscriptions)   │  on backend build
└──────────────────────┬───────────────────────┘
                       │
         Enforces Type │ Executes Commands
         Safety        ▼ & Queries
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

## Key Conventions

### 1. End-to-End Type Safety Pipeline

Type safety is **automatically synchronized** across layers during build:

1. Modify a **C# entity** in `backend/src/FactoryApp.Domain/`
2. Run `dotnet build backend/FactoryApp.slnx`
3. Hot Chocolate **auto-emits** `backend/src/FactoryApp.WebApi/schema.graphql`
4. Frontend file-watcher triggers GraphQL Code Generator via `pnpm codegen`
5. Type-safe Angular services **auto-update** in `frontend/src/app/api/generated/graphql.ts`

**Never manually edit `schema.graphql` or `graphql.ts`** — these are auto-generated.

### 2. The Shared Transaction Rule

When a **single mutation** updates domain state via EF Core **AND** logs bulk metrics via Dapper, they **must** share an explicit ADO.NET transaction to prevent deadlocks:

```csharp
using var transaction = await context.Database.BeginTransactionAsync();
var dbConnection = context.Database.GetDbConnection();
var dbTransaction = context.Database.CurrentTransaction?.GetDbTransaction();

// EF Core operations
var build = await context.Builds.FindAsync(buildId);
build.Status = BuildStatus.Complete;

// Dapper operations (pass transaction: dbTransaction)
await connection.ExecuteAsync(
    "INSERT INTO TestMetrics (BuildId, Value) VALUES (@BuildId, @Value)",
    new { BuildId = buildId, Value = 42.5 },
    transaction: dbTransaction
);

await context.SaveChangesAsync();
await transaction.CommitAsync();
```

### 3. Data Access Pattern

- **EF Core** (Change-tracked): Domain entity queries, schema migrations, Elsa workflow persistence
- **Dapper** (No-tracked): High-velocity telemetry ingestion, batch inserts from automated machines
- **Both** share explicit transactions when coordinating multi-step operations

All GraphQL queries use `QueryTrackingBehavior.NoTracking` for dashboard performance.

### 4. Hot Chocolate GraphQL Best Practices

- Use **`[UseProjection]`** on root query resolvers to auto-translate Angular's GraphQL field selections to optimized SQL `SELECT` columns
- Use **DataLoaders** for batch child-entity queries (e.g., Build → Parts) to prevent N+1 database hits
- Enforce **max query depth of 5 layers** — deeply nested queries like `Build { Parts { TestRuns { Logs { Metrics { Details } } } } }` are forbidden

### 5. Elsa Workflow v3 Integration

- Custom C# activities handle long-running manufacturing steps
- Store **only primitive keys** (Guid, string) in workflow state; fetch fresh domain data on activity execution
- Version workflows explicitly: allow old versions to complete naturally while routing new builds to the latest version
- Activities publish events via `ITopicEventSender` → Hot Chocolate broadcasts to Angular via subscriptions

### 6. Angular Components

- All components use `ChangeDetectionStrategy.OnPush` (required for high-frequency updates)
- Use explicit `trackBy` functions on all `*ngFor` loops to prevent unnecessary re-renders
- Real-time subscriptions should use `bufferTime(250)` to batch high-frequency telemetry updates

### 7. No Direct Entity Exposure in GraphQL

Never return raw EF Core entities in GraphQL resolvers. Map to DTOs first:

```csharp
// ❌ WRONG
[GraphQLType]
public class Build
{
    public Guid Id { get; set; }
    public DbSet<Part> Parts { get; set; }  // Don't expose navigation properties directly
}

// ✅ RIGHT
public class BuildDto
{
    public Guid Id { get; set; }
    public string Status { get; set; }
    // ... minimal fields only
}
```

This decouples schema evolution from database design.

## Repository Structure

```
ng-graphql-playground/
├── backend/src/
│   ├── FactoryApp.WebApi/
│   │   ├── Program.cs                    # Hot Chocolate setup, Elsa runtime
│   │   ├── schema.graphql                # [AUTO-GENERATED] GraphQL schema
│   │   └── FactoryApp.WebApi.csproj      # MSBuild targets for schema export
│   ├── FactoryApp.Domain/
│   │   ├── FactoryDbContext.cs           # EF Core DbContext (NoTracking default)
│   │   ├── Entities/                     # Build, Part, TestRun entities
│   │   └── Migrations/                   # Database migrations
│   ├── FactoryApp.GraphQL/
│   │   ├── Queries/                      # GraphQL query resolvers
│   │   ├── Mutations/                    # GraphQL mutation resolvers
│   │   └── DataLoaders/                  # Batch loaders for N+1 prevention
│   ├── FactoryApp.Workflows/
│   │   ├── Activities/                   # Custom Elsa activities
│   │   └── Definitions/                  # Workflow definitions
│   └── FactoryApp.sln
├── frontend/
│   ├── src/app/
│   │   ├── graphql/                      # GraphQL operation definitions (.graphql files)
│   │   ├── api/generated/
│   │   │   └── graphql.ts                # [AUTO-GENERATED] Type-safe services
│   │   ├── components/                   # Smart/Dumb components (OnPush enabled)
│   │   └── services/                     # Custom services (Apollo/Urql setup)
│   ├── codegen.ts                        # GraphQL Code-Gen configuration
│   ├── angular.json
│   ├── tsconfig.json
│   └── package.json
├── docs/
│   ├── research-architecuture-design.md  # Detailed design trade-offs
│   └── monorepo-assessment.md            # Tooling & structure recommendations
├── README.md
├── CLAUDE.md
└── .github/
    └── copilot-instructions.md           # This file
```

## IDE Recommendation

**JetBrains Rider 2024.x** is the gold standard:

- Native C# debugging with EF Core inspection
- Integrated SQL Server profiler (critical for Dapper tuning)
- Full-stack debugging (backend resolvers + network requests simultaneously)
- Hot Chocolate schema validation & autocomplete
- Elsa workflow visualization

## Common Debugging Scenarios

**Frontend type error: property X doesn't exist**

1. Verify the property exists in the C# entity
2. Check the Hot Chocolate resolver exposes it
3. Run `dotnet build` to re-emit `schema.graphql`
4. Run `pnpm codegen` to regenerate Angular services

**N+1 query performance issues**

1. Check if the resolver uses DataLoader for child entities
2. Add `[UseProjection]` to root query resolvers
3. Verify GraphQL query doesn't nest deeper than 5 layers

**Deadlock when updating Build + logging metrics**

1. Ensure both EF Core and Dapper operations share the same transaction
2. Confirm the transaction is not nested (one top-level scope)
3. Check SQL Server's deadlock graph in Activity Monitor

**Elsa workflow fails after schema update**

1. Verify activities only store primitive keys, not entity objects
2. Check if a column was renamed; Dapper queries will fail on old names
3. Deploy a new workflow version; don't force-update active runs

## Important Generated Files

| File                                           | Status         | Notes                                                |
| ---------------------------------------------- | -------------- | ---------------------------------------------------- |
| `backend/src/FactoryApp.WebApi/schema.graphql` | Auto-generated | Commit to repo; never edit manually                  |
| `frontend/src/app/api/generated/graphql.ts`    | Auto-generated | Never edit manually                                  |
| Database migrations                            | Manual         | Store in `backend/src/FactoryApp.Domain/Migrations/` |

## Performance Checklist

- [ ] EF Core context defaults to `QueryTrackingBehavior.NoTracking`
- [ ] All Hot Chocolate queries with child entities use DataLoaders
- [ ] GraphQL queries don't nest deeper than 5 layers
- [ ] Angular subscriptions use `bufferTime(250)` for high-frequency updates
- [ ] All `*ngFor` loops use `trackBy` functions
- [ ] SQL Server indexes cover foreign keys and high-query columns (Status, BuildId)
- [ ] Dapper is used exclusively for telemetry; never for domain queries
- [ ] Elsa workflow versions are managed; old versions complete naturally

## Development Workflow

1. **Modify** a C# entity or add a GraphQL resolver
2. **Build**: `dotnet build backend/FactoryApp.slnx`
3. **Schema updates**: Hot Chocolate auto-emits `schema.graphql`
4. **Frontend regenerates**: File-watcher triggers `pnpm codegen`
5. **Types flow automatically** to Angular services
6. **Angular IDE highlights** errors if queries reference removed fields

## GitHub Copilot Procedures

This repository includes **mandatory procedures** that Copilot must follow for specific tasks:

### PR Review Workflow (Required Reading)

When reviewing GitHub PRs, Copilot executes a **three-phase automated workflow** with **mandatory GitHub comment posting**:

**Location**: `.github/copilot/rules/pr-review-workflow.md`

**Key Points**:

- ✅ Phase 1: Gather PR details and examine changes
- ✅ Phase 2: Analyze code against architecture patterns
- ✅ Phase 3: **Post review outcomes as GitHub PR comment** ← MANDATORY
- 🔗 Comment must reference requirements and include verification checklist
- 📋 Review must be structured with verdict, file analysis, and quality metrics

**When Reviewing a PR**:

1. Read the PR description and linked issue
2. Use `code-review` agent for high-signal analysis
3. Generate comprehensive assessment document
4. **Post assessment as GitHub comment** using `gh pr comment` command
5. Never skip the comment posting step — it ensures team visibility

For full workflow details, procedures, and examples: See `.github/copilot/rules/pr-review-workflow.md`

### Additional Procedures

Other Copilot procedures are documented in `.github/copilot/`:

- `.github/copilot/README.md` — Index of all procedures
- `.github/copilot/rules/` — Directory of operational rules

## Related Documentation

- `README.md` — Project overview and quickstart
- `CLAUDE.md` — Comprehensive Claude Code guide with CI/CD, testing strategy, and skills
- `CONTRIBUTING.md` — Development workflow, code standards, testing, and security practices
- `SECURITY.md` — Vulnerability reporting, security policies, and best practices
- `docs/research-architecuture-design.md` — Detailed analysis of GraphQL vs REST, EF Core vs Dapper
- `docs/monorepo-assessment.md` — IDE recommendations, build orchestration, dependency management
