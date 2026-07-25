# CLAUDE.md — AI Execution Framework

**Version:** 3.1.0 | **Last Updated:** 2026-07-25  
**Canonical:** [AGENTS.md](./AGENTS.md) | **Rules:** [.claude/rules/](./.claude/rules/)

---

## Stack & Pipeline

**Full-stack**: Angular 19 | Hot Chocolate GraphQL | ASP.NET Core .NET 10 | Elsa v3.5.3 | SQL Server | EF Core + Dapper

| Trigger                | Action                                   | Why                                 |
| ---------------------- | ---------------------------------------- | ----------------------------------- |
| Domain model change    | `dotnet build ./backend/FactoryApp.slnx` | Emits schema.graphql auto           |
| schema.graphql changes | `pnpm codegen`                           | Regenerate graphql.ts (type-safety) |
| Before PR submit       | `pnpm build && pnpm test`                | Validate integration                |

---

## Architectural Constraints (PR Blockers)

**Do not bypass. Evidence in .claude/rules/.**

| Rule                        | Action                                      | Why                                       |
| --------------------------- | ------------------------------------------- | ----------------------------------------- |
| EF Core + Dapper in same op | Share explicit `DbTransaction`              | Deadlock on factory floor                 |
| GraphQL resolvers           | Return DTOs, never raw entities             | Schema decoupling + versioning            |
| GraphQL query depth         | ≤5 layers; split deeper → separate requests | Hot Chocolate complexity limits           |
| `*ngFor` loops              | Mandatory `trackBy` function                | Perf critical: 250ms subscription buffers |
| schema.graphql, graphql.ts  | Never edit manually                         | Auto-generated; regenerate via pipeline   |

**Evidence**: [database-rules.md](./.claude/rules/database-rules.md), [graphql-patterns.md](./.claude/rules/graphql-patterns.md), [frontend-patterns.md](./.claude/rules/frontend-patterns.md)

---

## Evidence-Based Execution (Two-Gate System)

**Gate 1: Plan Mode** (Before code)

- Enter Plan Mode before multi-file edits
- Review task tree in tasks.md
- Document dependencies

**Gate 2: Verification** (Before task complete)

- ✅ Build logs pass: `dotnet build` + `pnpm build`
- ✅ Tests pass: `pnpm test` (full suite)
- ✅ Type-safety: LSP `goToDefinition`, `findReferences` on changed symbols
- ✅ Regressions: Diff old/new test output

**Block Task Completion** if either gate fails. No PRs without both gates.

---

## Context Management (Token Pressure)

Execute immediately when drift detected:

1. **At 50% usage**: Run `/compact` — summarize + compress state
2. **Agent confusion**: Run `/rewind` — restart from last known good
3. **Long edits**: Enter Plan Mode → review dependencies → execute with Gate 2 checks

---

## Skill Discovery

**Location**: `.claude/skills/` | **Load**: Lazy via YAML frontmatter metadata

Discoverable skills (trigger on keyword):

- `pr-review-workflow` → Review PR (3-phase: quality, security, tests)
- `migration-generator` → DB changes (auto-creates + validates EF Core migrations)
- `codegen-sync` → Schema changes (regenerates graphql.ts for type-safety)
- `lsp-setup` → IDE setup (code intelligence)

**Add new skills** to `.claude/skills/<name>/SKILL.md` with YAML frontmatter. Auto-discover on use.

---

## Phase Ordering (Strict Sequence)

**Block PRs** if order violated.

**Backend**: #148 (authorization) → #149 (workflows) → #147 (rate limiting)  
**Frontend**: #47 (architecture) — ✅ COMPLETE

---

## Tools & Prerequisites

- **.NET 10+** (or .NET 9 for .slnx support)
- **Node.js 18+, pnpm 8+** (frontend)
- **Docker Desktop** (SQL Server container)
- **Global**: `dotnet tool install --global dotnet-ef`
- **IDE**: Rider 2024.x (C# profiler) or VS Code + extensions

---

## Rules Router (Modular Patterns by Domain)

**See `.claude/rules/` for implementation details:**

- `database-rules.md` — Transactions, real-DB testing, Dapper usage
- `backend-patterns.md` — EF Core, DataLoaders, projections
- `frontend-patterns.md` — Angular OnPush, trackBy, subscriptions, codegen
- `graphql-patterns.md` — Query depth, entity exposure, type-safety pipeline
- `workflow-integration.md` — Elsa v3.5.3 primitives, activity patterns
