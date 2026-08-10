# CLAUDE.md — AI Execution Framework

**Version:** 3.2.0 | **Last Updated:** 2026-08-01  
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

- **50% usage**: Run `/compact` — summarize + compress state
- **Agent confusion**: Run `/rewind` — restart from last known good
- **Long edits**: Enter Plan Mode → review dependencies → execute with Gate 2 checks

---

## Skill Discovery

**Location**: `.claude/skills/` | Discoverable skills:

- `codegen-sync` → Schema changes, regenerates graphql.ts
- `lsp-setup` → IDE setup (code intelligence)
- `migration-generator` → DB changes (auto-creates + validates migrations)
- `performance-audit` → Performance profiling (Lighthouse, bundle analysis)
- `pr-review-workflow` → Review PR (quality, security, tests)

New skills: Add `.claude/skills/<name>/SKILL.md` with YAML frontmatter.

---

## Performance Metrics & Auditing

**Phase 5 Complete**: OnPush 100% (≤30ms), TrackBy 100%, Lighthouse 87/81, no memory leaks.  
Use `performance-audit` skill for profiling or see **[AGENTS.md](./AGENTS.md#phase-5-performance-metrics--evidence)** for metrics.

---

## Phase Ordering (Strict Sequence)

**Block PRs** if order violated.

**Backend**: #148 (authorization) → #149 (workflows) → #147 (rate limiting)  
**Frontend**: #47 (architecture) — ✅ COMPLETE

---

## Tools & Prerequisites

**.NET 10+** | **Node.js 18+, pnpm 8+** | **Docker** (SQL Server) | **dotnet-ef global** | **Rider 2024.x or VS Code**

---

## Rules Router (Modular Patterns by Domain)

See `.claude/rules/` for implementation details:

- `accessibility-patterns.md` — WCAG 2.1 Level AA compliance, keyboard nav, ARIA
- `database-rules.md` — Transactions, real-DB testing, Dapper
- `backend-patterns.md` — EF Core, DataLoaders, projections
- `frontend-patterns.md` — Angular OnPush, trackBy, codegen
- `graphql-patterns.md` — Query depth, entity exposure, type-safety
- `workflow-integration.md` — Elsa v3.5.3 activities, patterns
