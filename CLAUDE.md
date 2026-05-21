# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A **full-stack monorepo** for managing long-running manufacturing workflows (Build, Parts, TestRun) with type-safe end-to-end automation.

**Stack:**
- **Frontend**: Angular 17+ with Apollo/Urql (GraphQL clients)
- **API Gateway**: Hot Chocolate GraphQL (ChilliCream)
- **Backend**: ASP.NET Core (.NET 8/9)
- **Workflows**: Elsa Workflows v3 (long-running state machine engine)
- **Database**: Microsoft SQL Server
- **Data Access**: Hybrid EF Core (reads, domain models, migrations) + Dapper (high-velocity writes)

---

## Quick Start Commands

### Backend (.NET)

```bash
# Restore dependencies
dotnet restore backend/src

# Build & auto-emit GraphQL schema
dotnet build backend/src/FactoryApp.sln

# Run database migrations (LocalDB or Express)
cd backend/src/FactoryApp.WebApi
dotnet ef database update

# Run backend server (with hot-reload)
dotnet watch run

# Run backend tests
dotnet test backend/src
```

### Frontend (Angular)

```bash
# Install dependencies
npm install --workspace=frontend

# Generate type-safe Angular services from GraphQL schema
npm run codegen --workspace=frontend

# Start Angular dev server (HMR enabled)
npm run ng serve --workspace=frontend

# Run frontend tests
npm run test --workspace=frontend

# Lint frontend code
npm run lint --workspace=frontend
```

### Monorepo (Root)

```bash
# Start both backend + frontend watchers concurrently
npm run dev

# Build both stacks
npm run build

# Run all tests (backend + frontend)
npm run test

# Lint entire monorepo
npm run lint
```

---

## Architecture at a Glance

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

The build system automatically synchronizes types across layers:

1. **Backend Build** → `dotnet build backend/src/FactoryApp.sln`
2. **Schema Export** → Hot Chocolate emits `schema.graphql`
3. **Frontend Code-Gen** → GraphQL Code Generator reads schema
4. **Type-Safe Angular Services** → Automatically generated to `src/app/api/generated/graphql.ts`

Developers modify C# entities → types flow to Angular automatically. No manual interface writing.

### 2. Separation of Concerns (Data Access)

- **EF Core** (Change-tracked): Domain entity operations, schema migrations, Elsa workflow persistence
- **Dapper** (No-tracked): High-velocity telemetry ingestion, batch inserts from automated machines
- **Both** share explicit ADO.NET transactions for atomic multi-step operations

When a mutation updates domain state *and* logs high-frequency metrics:
```csharp
using var transaction = await context.Database.BeginTransactionAsync();
var dbConnection = context.Database.GetDbConnection();
var dbTransaction = context.Database.CurrentTransaction?.GetDbTransaction();
// EF Core operations here
// Dapper operations here (pass transaction: dbTransaction)
await context.SaveChangesAsync();
await transaction.CommitAsync();
```

### 3. Hot Chocolate GraphQL Best Practices

- **[UseProjection]**: Auto-translates Angular's GraphQL field selections to optimized SQL `SELECT` columns
- **DataLoaders**: Batch child-entity queries (e.g., Build → Parts) to prevent N+1 database hits
- **No-Tracking Reads**: All GraphQL queries use `QueryTrackingBehavior.NoTracking` for dashboard performance

### 4. Elsa Workflow v3 Integration

- Custom C# activities handle long-running manufacturing steps (e.g., `VerifyPartsAllocated`, `RunTestSimulation`)
- Activities publish events via `ITopicEventSender` → Hot Chocolate broadcasts to Angular via subscriptions
- Store only primitive keys (BuildId, PartNumber) in workflow state; fetch fresh domain data on activity execution
- Version workflows explicitly: allow old versions to complete naturally while routing new builds to the latest version

### 5. Angular Real-Time Updates

- **Subscriptions**: RxJS streams pipe Hot Chocolate WebSocket/SSE updates
- **Buffering**: Use `bufferTime(250)` to batch high-frequency telemetry (prevents UI thrashing)
- **Change Detection**: All components use `ChangeDetectionStrategy.OnPush` with explicit `trackBy` functions on `*ngFor` loops

---

## Folder Structure

```
ng-graphql-playground/
├── backend/src/
│   ├── FactoryApp.WebApi/
│   │   ├── Program.cs (Hot Chocolate setup, Elsa runtime, GraphQL schema export)
│   │   ├── schema.graphql (auto-generated; commit to repo)
│   │   └── FactoryApp.WebApi.csproj (MSBuild targets for schema generation)
│   ├── FactoryApp.Domain/ (Entities: Build, Part, TestRun; DbContext)
│   ├── FactoryApp.GraphQL/ (Query/Mutation resolvers, DataLoaders)
│   ├── FactoryApp.Workflows/ (Elsa activities, workflow definitions)
│   └── FactoryApp.sln
├── frontend/
│   ├── src/app/
│   │   ├── graphql/ (.graphql operation files: BuildQuery.graphql, etc.)
│   │   ├── api/generated/ (graphql.ts generated here)
│   │   └── components/ (Smart/Dumb layout; OnPush enabled)
│   ├── codegen.ts (GraphQL Code-Gen config)
│   ├── angular.json
│   └── package.json
├── docs/
│   ├── monorepo-assessment.md (Tooling & structure recommendations)
│   └── research-architecuture-design.md (Detailed design trade-offs)
└── CLAUDE.md (this file)
```

---

## Critical Rules & Conventions

### The Shared Transaction Rule

When updating a core asset via EF Core *and* logging bulk metrics via Dapper in the same operation, **always** use an explicit transaction. Forgetting this causes deadlocks on the factory floor.

### GraphQL Query Depth Limits

Hot Chocolate enforces a max nesting depth of 5 layers. Frontend developers must not construct deeply nested queries like:
```graphql
Build { Parts { TestRuns { Logs { Metrics { Details } } } } }
```
This generates catastrophic N+1 queries. Use DataLoaders and separate requests instead.

### No Direct Entity Exposure

Never return raw EF Core entities in GraphQL resolvers. Map to DTOs first. This decouples schema evolution from database design.

### Elsa Workflow State Storage

Store only **primitive keys** in Elsa workflow variables (Guid, string). When an activity resumes, fetch fresh domain state from the database using those keys. This isolates active long-running workflows from schema updates.

### Schema.graphql is Generated

`backend/src/FactoryApp.WebApi/schema.graphql` is **auto-emitted** on every `dotnet build`. Always commit this file; never edit manually. The frontend watches this file for changes and re-generates `graphql.ts` automatically.

---

## Development Workflow

1. **Modify a C# entity** (e.g., add a property to `Build`)
2. **Run `dotnet build`** in backend
3. **Hot Chocolate emits updated `schema.graphql`**
4. **Frontend file-watcher triggers `npm run codegen`**
5. **Type-safe `graphql.ts` services update automatically**
6. **Angular IDE shows compile errors if queries reference removed fields**

---

## Testing Strategy

### Backend

- Unit tests: `dotnet test backend/src` (fast, in-memory where possible)
- Integration tests: Use real SQL Server LocalDB; test EF Core + Dapper interactions in same transaction
- Avoid mocking the database for EF Core migration tests (caught bugs in production when mocks diverged)

### Frontend

- Component tests: `npm run test --workspace=frontend` (Jasmine/Karma)
- E2E tests: Via Angular testing utilities; mock Apollo/Urql responses
- Real GraphQL integration: Test against a staging backend running the full Hot Chocolate gateway

---

## IDE Recommendation

**JetBrains Rider 2024.x** is the gold standard for this monorepo:
- Native C# debugging with EF Core inspection
- Integrated SQL Server profiler (critical for Dapper tuning)
- Full-stack debugging (backend resolvers + network requests simultaneously)
- Hot Chocolate schema validation & autocomplete
- Elsa workflow visualization

VS Code is feasible but lacks the integrated database tools and C# debugging depth required for this architecture.

---

## GitHub Copilot CLI Compatibility

This project is configured to work seamlessly with GitHub Copilot CLI:
- `.claude/settings.json` defines permissions and hooks for Claude Code sessions
- `CLAUDE.md` (this file) is automatically loaded in every session
- Skills are available through two distinct systems (see below)

### Two-System Skill Architecture

GitHub Copilot CLI and Claude Code use **separate skill delivery mechanisms**:

| System | Skill Source | Configuration | Installation |
|--------|--------------|----------------|--------------|
| **Claude Code** | Configured in settings | `.claude/settings.json` (skillOverrides) | Auto-loaded ✅ |
| **GitHub Copilot CLI** | Plugin marketplace | GitHub repository + `copilot.yml` | `gh copilot -- plugin install` |

### Claude Code Skills (Auto-Loaded)

Available automatically in Claude Code sessions:

- `factory-app-session-blog` — Document full-stack monorepo work as portfolio-ready blog posts. Extracts architectural patterns (type-safety pipeline, DataLoaders, shared transactions, Elsa workflows) and synthesizes professional gists.
- `fix-github-issues` — Automated GitHub issue fixing workflow
- `example-skills:session-blog-to-gist` — Convert session work into a blog post
- `example-skills:push-feature-branch` — Create feature branch, commit, push to remote
- `example-skills:doc-coauthoring` — Structured workflow for writing documentation
- `update-config` — Configure Claude Code settings (permissions, hooks, env vars)
- `secure-github-repo` — GitHub repository security hardening

Invoke any skill via `/skill-name` in your Claude Code session.

### GitHub Copilot CLI Skills (Plugin Installation Required)

To use skills in GitHub Copilot CLI (`gh copilot`), install the plugin:

```bash
# Install the factory-app plugin
gh copilot -- plugin install pluto-atom-4/copilot-plugin-factory-app

# Verify installation
gh copilot -- plugin list

# Use in interactive session
gh copilot -i "Use the factory-app-session-blog skill to document this work"

# Or in non-interactive mode
gh copilot -p "Document this session" --allow-all-tools
```

For more information on GitHub Copilot CLI plugins, see:
- [CLI Plugin Documentation](https://docs.github.com/copilot/concepts/agents/copilot-cli/about-cli-plugins)
- [Plugin Repository](https://github.com/pluto-atom-4/copilot-plugin-factory-app)

### Using GitHub Copilot CLI in This Directory

```bash
# Ask questions about code or commands
gh copilot -- -i "How does the GraphQL type-safety pipeline work?"

# Get suggestions
gh copilot -- -i "Write a test for the shared transaction pattern"

# Use installed plugins
gh copilot -- -i "Document this architectural work for my portfolio"
```

---

## Monorepo Build Orchestration

Root-level `package.json` manages the entire build:

```json
{
  "scripts": {
    "build": "npm run build:backend && npm run build:frontend",
    "build:backend": "dotnet build ./backend/src/FactoryApp.sln",
    "build:frontend": "npm run build --workspace=frontend",
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "dotnet watch run --project ./backend/src/FactoryApp.WebApi",
    "dev:frontend": "npm run ng serve --workspace=frontend",
    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "dotnet test ./backend/src",
    "test:frontend": "npm run test --workspace=frontend",
    "codegen": "npm run codegen --workspace=frontend",
    "lint": "npm run lint --workspace=frontend"
  }
}
```

---

## Common Debugging Scenarios

### "Frontend type error: property X doesn't exist"
1. Check if the property exists in the C# entity
2. Verify the Hot Chocolate resolver exposes it
3. Run `dotnet build` to re-emit `schema.graphql`
4. Re-run `npm run codegen` to regenerate Angular services

### "N+1 query performance issue in Hot Chocolate"
1. Check if the resolver uses a DataLoader for child entities
2. Add `[UseProjection]` to the root query resolver
3. Verify the GraphQL query doesn't nest deeper than 5 layers

### "Deadlock when updating Build + logging metrics"
1. Ensure both EF Core and Dapper operations share the same `DbTransaction`
2. Confirm the transaction is not nested (one top-level transaction scope)
3. Check SQL Server's deadlock graph in Activity Monitor

### "Elsa workflow fails on resume after schema update"
1. Verify the activity only stores primitive keys, not entity objects
2. Check if a column was renamed; Dapper queries referencing old column names will fail
3. Deploy a new workflow version; don't force-update active runs

---

## CI/CD Pipeline

GitHub Actions workflows are recommended:

```yaml
# .github/workflows/backend.yml
name: Backend Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '8.0'
      - run: dotnet build ./backend/src/FactoryApp.sln
      - run: dotnet test ./backend/src
```

---

## Performance Tuning Checklist

- [ ] EF Core context configured with `QueryTrackingBehavior.NoTracking` by default
- [ ] All Hot Chocolate queries with child entities use DataLoaders
- [ ] `schema.graphql` includes `@cost` directives for query complexity limits
- [ ] Angular subscriptions use `bufferTime(250)` for high-frequency updates
- [ ] All `*ngFor` loops use `trackBy` functions
- [ ] SQL Server indexes cover foreign keys (BuildId, PartId) and high-query columns (Status)
- [ ] Dapper is used exclusively for telemetry writes; never for domain queries
- [ ] Elsa workflow definitions are versioned; old versions complete naturally

---

## Important Files & Their Roles

| File | Purpose |
|------|---------|
| `backend/src/FactoryApp.WebApi/Program.cs` | Hot Chocolate bootstrap, EF Core config, Elsa setup |
| `backend/src/FactoryApp.WebApi/schema.graphql` | **Auto-generated** GraphQL schema; commit to repo |
| `backend/src/FactoryApp.Domain/FactoryDbContext.cs` | EF Core DbContext with NoTracking default |
| `frontend/src/app/api/generated/graphql.ts` | **Auto-generated** type-safe services; never edit |
| `frontend/codegen.ts` | GraphQL Code Generator configuration |
| `frontend/angular.json` | Angular workspace config |
| `docs/research-architecuture-design.md` | Detailed trade-off analysis & recommendations |
| `docs/monorepo-assessment.md` | Tooling & structure best practices |

---

## Related Documentation

- **Architecture Trade-offs**: See `/docs/research-architecuture-design.md` for detailed analysis of GraphQL vs REST, EF Core vs Dapper, and performance trade-offs
- **Monorepo Structure**: See `/docs/monorepo-assessment.md` for IDE recommendations, build orchestration, and dependency management strategies
- **Project README**: See `README.md` for quickstart setup instructions
