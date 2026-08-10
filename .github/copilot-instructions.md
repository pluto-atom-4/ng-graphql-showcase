---
name: copilot-instructions
description: Cross-AI guide for GitHub Copilot and Claude Code CLI in full-stack monorepo
version: 1.2.0
last_updated: 2026-08-09
applies_to:
  - "**/*.ts"
  - "**/*.cs"
  - "**/*.graphql"
  - "backend/**"
  - "frontend/**"
  - ".claude/**"
compatibility:
  - github-copilot-cli
  - claude-code
  - claude-agents
related_rules:
  - .claude/rules/database-rules.md
  - .claude/rules/backend-patterns.md
  - .claude/rules/frontend-patterns.md
  - .claude/rules/graphql-patterns.md
  - .claude/rules/workflow-integration.md
  - .claude/rules/accessibility-patterns.md
categories:
  - architecture
  - type-safety
  - performance
  - database
---

# Copilot Instructions for ng-graphql-playground

**Version:** 1.2.0 | **Last Updated:** 2026-08-09  
**Type-safe full-stack monorepo** for long-running manufacturing workflows.

## Project Stack

- **Frontend**: Angular 19+ (GraphQL subscriptions)
- **API**: Hot Chocolate GraphQL (type-safe, auto-emits schema)
- **Backend**: ASP.NET Core .NET 10 (EF Core + Dapper hybrid)
- **Workflows**: Elsa v3.5.3 (long-running orchestration)
- **Database**: SQL Server 2022 (transactional ACID)

## Build & Test Commands

### Backend

```bash
dotnet build backend/FactoryApp.slnx          # Emits schema.graphql auto
dotnet test backend/src                       # Integration tests vs SQL Server
cd backend/src/FactoryApp.WebApi && dotnet watch run  # Dev server
```

### Frontend

```bash
pnpm --filter frontend run codegen            # Regenerate graphql.ts
pnpm --filter frontend run ng serve           # Dev server (HMR)
pnpm --filter frontend run test                 # Vitest + Testing Library
```

### Monorepo (Root)

```bash
pnpm dev                                      # Concurrent backend + frontend watchers
pnpm build && pnpm test                       # CI/CD validation
```

## Type Safety Pipeline (Automatic Sync)

1. **Backend change**: Modify C# entity in `Domain/`
2. **Build**: `dotnet build backend/FactoryApp.slnx`
3. **Schema emitted**: Hot Chocolate auto-writes `schema.graphql`
4. **Frontend regenerates**: `pnpm codegen` (via file-watcher)
5. **Type-safe services**: Angular imports from `graphql.ts` (auto-generated)

**Never edit `schema.graphql` or `graphql.ts` manually** — always regenerate via pipeline.

## Key Constraints (PR Blockers)

| Constraint                 | Action                          | Why                        |
| -------------------------- | ------------------------------- | -------------------------- |
| EF Core + Dapper same op   | Share explicit `DbTransaction`  | Deadlock prevention        |
| GraphQL resolvers          | Return DTOs, never raw entities | Schema versioning          |
| Query depth                | ≤5 layers; split deeper queries | Hot Chocolate limits       |
| `*ngFor` loops             | Mandatory `trackBy` function    | 250ms subscription buffers |
| schema.graphql, graphql.ts | Never edit manually             | Auto-generated pipeline    |

See [.claude/rules/](../.claude/rules/) for enforcement details.

## Architectural Patterns (Domain-Specific)

### Data Access (Hybrid EF Core + Dapper)

```csharp
using var transaction = await context.Database.BeginTransactionAsync();

// EF Core reads with NoTracking projection
var builds = await context.Builds
  .AsNoTracking()
  .ProjectTo<BuildDto>(_mapper.ConfigurationProvider)
  .ToListAsync();

// Dapper high-velocity writes (share transaction)
await connection.ExecuteAsync(
    "INSERT INTO Telemetry (...) VALUES (@BuildId, @Value)",
    new { BuildId = buildId, Value = 42 },
    transaction: dbTransaction
);

await transaction.CommitAsync();
```

**Transaction rule (CRITICAL)**: EF Core + Dapper in same operation must share explicit `DbTransaction` or factory-floor deadlocks occur.

### GraphQL (Hot Chocolate)

- Use `[UseProjection]` on resolvers to optimize SQL SELECT
- Use DataLoaders to prevent N+1 queries on child entities
- Enforce max nesting depth of 5 layers (use separate queries)
- Return DTOs, never raw EF Core entities

### Angular (High-Frequency Updates)

- All components: `ChangeDetectionStrategy.OnPush`
- All `*ngFor` loops: explicit `trackBy` function
- Real-time subscriptions: `bufferTime(250)` to aggregate high-velocity updates
- Auto-generated queries: import from `graphql.ts` (never edit manually)

### Workflows (Elsa v3.5.3)

- Store only primitive keys (Guid, string) in workflow state
- Fetch fresh domain data at each activity execution
- Activities are stateless handlers; prefer immutability
- Use compensation workflows for rollback on failure

See `.claude/rules/` for complete enforcement documentation.

## Agent Mode (Claude Code Background Execution)

When Claude Code spawns background agents (Tasks, Scheduled Crons, Dynamic Workflows):

1. **Use Plan agent** for multi-file architectural changes
2. **Use caveman agents** for bounded edits (1-2 files)
3. **Use general-purpose** for broad searches across codebase
4. **Use Explore** for read-only analysis with fan-out discovery

Agents inherit `.claude/rules/` patterns automatically via CLAUDE.md loading.

### Pre-Execution Checks (Gate 1: Plan)

- Review task dependencies in `.claude/tasks.md`
- Verify no contradictions across config files
- Document multi-file edit dependencies
- Check for rule violations in proposed changes

### Post-Execution Validation (Gate 2: Verify)

- ✓ `dotnet build backend/FactoryApp.slnx` passes
- ✓ `pnpm build && pnpm test` pass (frontend)
- ✓ No regressions in existing tests
- ✓ Type-safety: LSP definitions resolve correctly

**Block PR completion if either gate fails.**

## GitHub Copilot Procedures

### PR Review Workflow (Mandatory)

When reviewing PRs, Copilot must:

1. Gather PR details and changed files
2. Analyze against architecture patterns (see `.claude/rules/`)
3. Post review as GitHub comment (mandatory)
4. Include verdict, file analysis, and verification checklist

**Procedure location**: `.github/copilot/rules/pr-review-workflow.md`

## Debugging Quick Reference

| Issue               | Root Cause                     | Fix                                |
| ------------------- | ------------------------------ | ---------------------------------- |
| Frontend type error | schema.graphql not regenerated | `dotnet build` → `pnpm codegen`    |
| N+1 query perf      | Missing DataLoader             | Add `[UseProjection]` to resolver  |
| Deadlock            | Separate transactions          | Share `DbTransaction` in operation |
| Workflow fails      | Complex object in state        | Store only Guid/string primitives  |

## Performance Checklist

- [ ] EF Core: `QueryTrackingBehavior.NoTracking` default
- [ ] Resolvers: `[UseProjection]` + DataLoaders (no N+1)
- [ ] GraphQL: max depth 5 layers, split deeper queries
- [ ] Angular: `ChangeDetectionStrategy.OnPush` + `trackBy`
- [ ] Subscriptions: `bufferTime(250)` aggregation
- [ ] SQL: Indexes on FK, Status, CreatedAt columns
- [ ] Dapper: telemetry only (never domain queries)

## Repository Structure

- `backend/FactoryApp.slnx` — Main .NET solution
- `backend/src/FactoryApp.Domain/` — EF Core entities + migrations
- `frontend/src/app/api/generated/graphql.ts` — [AUTO-GENERATED]
- `.claude/rules/` — Enforcement documentation
- `CLAUDE.md` — Comprehensive AI execution framework
- `.github/copilot/rules/` — Copilot-specific procedures

## IDE Recommendation

**JetBrains Rider 2024.x** (gold standard):

- Native C# debugging + EF Core inspection
- SQL Server profiler (Dapper tuning)
- Full-stack debugging (backend + network simultaneously)
- Hot Chocolate schema validation & autocomplete

## Related Documentation

- `README.md` — Quickstart and project overview
- `CLAUDE.md` — Comprehensive execution framework
- `CONTRIBUTING.md` — Development workflow and security
- `.claude/rules/` — Modular architecture enforcement
