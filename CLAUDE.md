# CLAUDE.md

This file provides guidance to Claude Code when working in this repository. See `/docs/` for detailed documentation.

## Project Overview

A **full-stack monorepo** for managing long-running manufacturing workflows (Build, Parts, TestRun) with type-safe end-to-end automation.

**Stack:** Angular 17+ | Hot Chocolate GraphQL | ASP.NET Core (.NET 8/9) | Elsa Workflows v3 | SQL Server | EF Core + Dapper

---

## Quick Start

### Setup (One-Time)

```bash
pnpm install
pnpm setup              # Starts Docker + applies migrations
```

### Development

```bash
pnpm dev               # Concurrent backend + frontend watchers
# Terminal 1: pnpm dev:backend  (Port 5275)
# Terminal 2: pnpm dev:frontend (Port 4200)
```

### Database

```bash
pnpm docker:up         # Start SQL Server
pnpm db:migrate        # Apply EF Core migrations
pnpm docker:down       # Stop containers
```

### Build & Test

```bash
pnpm build            # Build both stacks
pnpm test             # Run all tests
pnpm lint             # Lint code
```

See **README.md** for service URLs and access details.

---

## Critical Rules

### 1. Shared Transaction Rule

EF Core + Dapper writes in same operation **must** share an explicit `DbTransaction`:

```csharp
using var transaction = await context.Database.BeginTransactionAsync();
// EF Core ops...
// Dapper ops (pass transaction)...
await transaction.CommitAsync();
```

Forgetting this causes factory-floor deadlocks.

### 2. GraphQL Query Depth

Max nesting: 5 layers. Use DataLoaders + separate requests, not deeply nested queries.

### 3. Entity Exposure

Never return raw EF Core entities in GraphQL resolvers. Map to DTOs first.

### 4. Elsa Workflow State

Store only primitive keys (Guid, string) in workflow variables. Fetch fresh domain state on activity execution.

### 5. Generated Files

- `schema.graphql` — Auto-emitted on `dotnet build`; commit to repo
- `graphql.ts` — Auto-generated from schema; never edit manually

---

## Essential Commands

| Task             | Command                                                               |
| ---------------- | --------------------------------------------------------------------- |
| Add EF migration | `cd backend/src/FactoryApp.WebApi && dotnet ef migrations add <Name>` |
| Apply migrations | `pnpm db:migrate`                                                     |
| List migrations  | `dotnet ef migrations list`                                           |
| Run backend      | `dotnet watch run`                                                    |
| Run frontend     | `pnpm --filter frontend run ng serve`                                 |
| Build backend    | `dotnet build ./backend/FactoryApp.slnx`                              |
| Build frontend   | `pnpm --filter frontend run build`                                    |

---

## Architecture Highlights

- **Type Safety Pipeline**: C# entity → schema.graphql → graphql.ts (automatic on build)
- **Hybrid Data Access**: EF Core (reads/migrations) + Dapper (high-velocity writes)
- **Projections & DataLoaders**: Prevent N+1 queries; optimize SQL SELECT columns
- **Real-Time**: Hot Chocolate subscriptions via WebSockets/SSE to Angular

See `/docs/ARCHITECTURE.md` for detailed patterns.

---

## Documentation Structure

| File                                  | Purpose                                                   |
| ------------------------------------- | --------------------------------------------------------- |
| **README.md**                         | Quickstart, setup, troubleshooting                        |
| **docs/ARCHITECTURE.md**              | Design patterns, type-safety pipeline, Elsa integration   |
| **docs/DATABASE.md**                  | Database config, migrations, testing strategy             |
| **docs/DEVELOPMENT.md**               | IDE setup, debugging, development workflow                |
| **docs/PROCEDURES.md**                | PR review workflow, GitHub Copilot integration            |
| **docs/HTTP-CLIENT-TESTING-GUIDE.md** | GraphQL API testing via JetBrains HTTP Client (IDE + CLI) |
| **docs/GITHUB-ACTIONS.md**            | CI/CD workflows & automation; HTTP test workflow status   |

---

## IDE & Tools

**Recommended:** JetBrains Rider 2024.x (C# debugging, SQL profiler, Elsa visualization)

**Also works:** VS Code (requires additional extensions)

**Required tools:**

- .NET SDK 8.0+ (or 9.0 for .slnx support)
- Node.js 18+
- pnpm 8+
- Docker Desktop (for SQL Server)
- dotnet-ef (install: `dotnet tool install --global dotnet-ef`)

---

## Testing

- **Backend:** `dotnet test backend/src` (unit + integration with real LocalDB)
- **Frontend:** `pnpm --filter frontend run test` (Vitest + Testing Library)

Avoid mocking database in EF Core tests; use real LocalDB instead.

---

## Performance Checklist

- [ ] EF Core context: `QueryTrackingBehavior.NoTracking` by default
- [ ] DataLoaders for child entities (Build → Parts → TestRuns)
- [ ] Angular subscriptions: `bufferTime(250)` for high-frequency updates
- [ ] All `*ngFor`: explicit `trackBy` functions
- [ ] SQL indexes: foreign keys + Status/CreatedAt columns
- [ ] Dapper: telemetry writes only (never domain queries)

---

## Skills & CLI

Available skills in Claude Code sessions:

- `factory-app-session-blog` — Document work as portfolio blog posts
- `fix-github-issues` — Auto-fix GitHub issues
- `secure-github-repo` — Repository security hardening
- `update-config` — Configure Claude Code settings

Invoke via `/skill-name` in Claude Code.

---

## Common Issues

| Issue                  | Solution                                                                   |
| ---------------------- | -------------------------------------------------------------------------- |
| "SQL Server not ready" | Wait 15s after `pnpm docker:up`; check `docker logs ng-graphql-sql-server` |
| "dotnet-ef not found"  | `dotnet tool install --global dotnet-ef`                                   |
| "Type doesn't exist"   | Run `dotnet build` → `pnpm codegen`                                        |
| "N+1 queries"          | Add DataLoader to resolver + `[UseProjection]`                             |
| "Deadlock error"       | Ensure EF Core + Dapper share same `DbTransaction`                         |

See **docs/DATABASE.md** for detailed troubleshooting.

---

**Last Updated:** 2026-06-23 | **Stack:** .NET 9 + Angular 17 + SQL Server 2022
