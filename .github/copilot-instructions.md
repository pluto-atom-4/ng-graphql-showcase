---
name: copilot-instructions
description: Cross-AI guide for GitHub Copilot and Claude Code CLI in full-stack monorepo
version: 1.4.0
last_updated: 2026-08-22
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

**Version:** 1.4.0 | **Last Updated:** 2026-08-22

Type-safe full-stack monorepo (Angular 19 | GraphQL | ASP.NET Core | Elsa Workflows | SQL Server).

**Setup & Commands**: See [AGENTS.md#setup--verification-commands](../../AGENTS.md#setup--verification-commands) for build, test, infrastructure commands.

## Type-Safe Pipeline

C# entity → `schema.graphql` (auto-emitted) → `graphql.ts` (auto-generated). **Never edit schema.graphql or graphql.ts manually.** See [AGENTS.md#key-property](../../AGENTS.md#key-property) for pipeline detail.

## Key Constraints (PR Blockers)

| Constraint                 | Action                          | Why                        |
| -------------------------- | ------------------------------- | -------------------------- |
| EF Core + Dapper same op   | Share explicit `DbTransaction`  | Deadlock prevention        |
| GraphQL resolvers          | Return DTOs, never raw entities | Schema versioning          |
| Query depth                | ≤5 layers; split deeper queries | Hot Chocolate limits       |
| `*ngFor` loops             | Mandatory `trackBy` function    | 250ms subscription buffers |
| schema.graphql, graphql.ts | Never edit manually             | Auto-generated pipeline    |

See [.claude/rules/](../.claude/rules/) for enforcement details.

**Architectural Patterns**: See [.claude/rules/](../../.claude/rules/) for domain-specific patterns (database, backend, frontend, GraphQL, workflows). Code examples at each canonical rule file.

## Agent Collaboration

Agents inherit `.claude/rules/` patterns automatically via [CLAUDE.md](../../CLAUDE.md). See [AGENTS.md#agent-guardrails--boundaries](../../AGENTS.md#agent-guardrails--boundaries) for agent guardrails and two-gate verification system.

---

## Path-Specific Rule Auto-Loading (Phase 3)

**Copilot can auto-load domain-specific rules based on file paths being edited.**

### How It Works

- Each rule file in [`.github/copilot/rules/`](../copilot/rules/) has `applies_to:` glob patterns
- When you edit a file matching a pattern, the rule auto-appends to context
- Skills in `.claude/skills/*/SKILL.md` also have `applies_to:` patterns for auto-detection

### Rule Files Auto-Loaded By Domain

| File Path Edit                                   | Auto-Loaded Rules                               |
| ------------------------------------------------ | ----------------------------------------------- |
| `backend/src/**/*.cs`                            | backend-patterns.md, database-rules.md          |
| `frontend/src/**/*.ts`, `frontend/src/**/*.html` | frontend-patterns.md, accessibility-patterns.md |
| `**/*.graphql`, `backend/**/*Query*.cs`          | graphql-patterns.md, backend-patterns.md        |
| `.husky/**`, `.git/hooks/pre-commit`             | pre-commit-enforce skill                        |
| `backend/src/**/*Workflow*.cs`                   | workflow-integration.md                         |

### Manual Control

- `/rule skip <name>` — Disable rule for this session
- `/rule force <name>` — Force-load rule (even if path doesn't match)
- `/rule list` — Show currently loaded rules

**Full documentation**: See [.github/copilot/rules/README.md](../copilot/rules/README.md) for precedence rules, troubleshooting, and tech-stack mapping.

---

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
