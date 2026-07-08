# CLAUDE.md

AI agent guidance router. Modular rules + skills. See `/docs/` for detailed documentation.

## Project Overview

Full-stack monorepo for long-running manufacturing workflows (Build, Parts, TestRun) with type-safe end-to-end automation.

**Stack:** Angular 19+ | Hot Chocolate GraphQL | ASP.NET Core (.NET 10) | Elsa Workflows v3.5.3 | SQL Server | EF Core + Dapper

---

## ⚠️ NEVER DO THIS

- ❌ Return raw EF Core entities in GraphQL (use DTOs)
- ❌ EF Core + Dapper writes without shared `DbTransaction` (causes deadlocks)
- ❌ Mock DbContext in tests (use real SQL Server)
- ❌ Edit `graphql.ts` manually (auto-generated, regenerate with `pnpm codegen`)
- ❌ Store complex objects in Elsa workflow variables (use primitives only: Guid, string)
- ❌ GraphQL queries > 5 layers deep (split into separate requests)
- ❌ `*ngFor` without `trackBy` function (performance killer)
- ❌ Implement Issue #147 (rate limiting) before #148 (authorization) is complete
- ❌ Implement Issue #149 (workflows) before #148 (authorization) is merged
- ❌ Use OAuth/SAML before #148 authorization is complete
- ❌ Enable rate limiting before #149 workflows are stable

---

## Quick Start

```bash
pnpm install && pnpm setup      # Setup + Docker + migrations
pnpm dev                         # Concurrent backend + frontend (ports 5275, 4200)
pnpm docker:up                   # Start SQL Server
pnpm db:migrate                  # Apply migrations
pnpm build && pnpm test          # Build + test
pnpm lint                        # Lint code
```

See **README.md** for service URLs.

---

## DESIGN.md Integration

**CLAUDE.md** (this file) defines **behavior rules, testing patterns, and constraints**.  
**DESIGN.md** defines **visual consistency, component library, and UI boundaries**.

| Decision Type                                         | File      | Example                                           |
| ----------------------------------------------------- | --------- | ------------------------------------------------- |
| Component layout, CSS classes, semantic tokens        | DESIGN.md | Use `class="p-4 bg-primary"` not inline styles    |
| Mutation ordering, transaction safety, async patterns | CLAUDE.md | Share `DbTransaction` for EF Core + Dapper writes |
| Authorization policies, rate limits                   | CLAUDE.md | See **Phase-Based Guardrails** table below        |

**Golden Rule**: Visual → DESIGN.md; Behavior → CLAUDE.md

---

## Phase-Based Guardrails

Strict execution order required. Backend: #148 → #149 → #147. Frontend tracking: [Issue #47](https://github.com/pluto-atom-4/ng-graphql-showcase/issues/47). Backend tracking: [Issue #145](https://github.com/pluto-atom-4/ng-graphql-showcase/issues/145).

| Phase                   | Do NOT                                 | Do                                              | Issue | Status                                                                  |
| ----------------------- | -------------------------------------- | ----------------------------------------------- | ----- | ----------------------------------------------------------------------- |
| Phase 1 (Frontend)      | Edit `graphql.ts` manually             | Add `ChangeDetectionStrategy.OnPush` everywhere | #47   | [#47](https://github.com/pluto-atom-4/ng-graphql-showcase/issues/47)    |
| Phase 2 (Backend Auth)  | Deploy without `@Authorize` policies   | Implement authorization foundation first        | #148  | [#145](https://github.com/pluto-atom-4/ng-graphql-showcase/issues/145)  |
| Phase 3 (Workflows)     | Store complex objects in workflow vars | Elsa 3.5.3 + async invocation (in-memory MVP)   | #149  | [#176](https://github.com/pluto-atom-4/ng-graphql-showcase/pull/176) ✅ |
| Phase 4 (Rate Limiting) | Enable before #149 workflows stable    | Start with high thresholds; monitor             | #147  | [#145](https://github.com/pluto-atom-4/ng-graphql-showcase/issues/145)  |

---

## Rules Router

Domain-specific patterns in `.claude/rules/`:

- **[database-rules.md](.claude/rules/database-rules.md)** — Transactions, testing (real DB, no mocks), EF Core + Dapper
- **[graphql-patterns.md](.claude/rules/graphql-patterns.md)** — Query depth, entity exposure, type safety pipeline, subscriptions
- **[backend-patterns.md](.claude/rules/backend-patterns.md)** — ASP.NET Core, testing, DataLoaders, projections
- **[frontend-patterns.md](.claude/rules/frontend-patterns.md)** — Angular, trackBy, buffering, codegen sync, subscriptions
- **[workflow-integration.md](.claude/rules/workflow-integration.md)** — Elsa v3, primitive-only state, activity patterns

**Upcoming (Issues #148-149)**:

- Authorization patterns (`@Authorize` policies, resolver-level guards) — #148
- Rate-limiting patterns (middleware, token bucket, Redis integration) — #147

---

## Skills

Atomic workflow playbooks in `.claude/skills/`:

- **[pr-review-workflow](./claude/skills/pr-review-workflow/)** — Automated PR review (quality, security, tests)
- **[migration-generator](./claude/skills/migration-generator/)** — Safe EF Core migrations with validation
- **[codegen-sync](./claude/skills/codegen-sync/)** — Sync schema.graphql → graphql.ts

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

## IDE & Tools

**Recommended:** JetBrains Rider 2024.x (C# debugging, SQL profiler)  
**Also works:** VS Code (requires extensions)

**Required:**

- .NET SDK 8.0+ (9.0 for .slnx)
- Node.js 18+, pnpm 8+
- Docker Desktop (SQL Server)
- `dotnet tool install --global dotnet-ef`

---

## Documentation Structure

| File                                  | Purpose                                 |
| ------------------------------------- | --------------------------------------- |
| **README.md**                         | Quickstart, setup, troubleshooting      |
| **docs/ARCHITECTURE.md**              | Design patterns, type-safety, Elsa      |
| **docs/DATABASE.md**                  | Migrations, testing strategy            |
| **docs/DEVELOPMENT.md**               | IDE setup, debugging                    |
| **docs/PROCEDURES.md**                | PR workflow, GitHub Copilot             |
| **docs/HTTP-CLIENT-TESTING-GUIDE.md** | GraphQL testing (JetBrains HTTP Client) |
| **docs/GITHUB-ACTIONS.md**            | CI/CD workflows                         |

---

## Troubleshooting

| Issue                  | Solution                                                      |
| ---------------------- | ------------------------------------------------------------- |
| "SQL Server not ready" | Wait 15s after `pnpm docker:up`                               |
| "dotnet-ef not found"  | `dotnet tool install --global dotnet-ef`                      |
| "Type doesn't exist"   | `dotnet build` → `pnpm codegen`                               |
| "N+1 queries"          | Add DataLoader + `[UseProjection]` (see [[backend-patterns]]) |
| "Deadlock error"       | Share `DbTransaction` (see [[database-rules]])                |

See **docs/DATABASE.md** for more.

---

**Architecture:** Type safety pipeline (C# → schema.graphql → graphql.ts auto-generated)  
**Stack:** .NET 10 | Angular 19 | SQL Server 2022 | Elsa v3
