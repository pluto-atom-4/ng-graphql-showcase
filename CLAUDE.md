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

- `database-rules.md` — Transactions, real-DB testing, Dapper
- `backend-patterns.md` — EF Core, DataLoaders, projections
- `frontend-patterns.md` — Angular OnPush, trackBy, codegen
- `graphql-patterns.md` — Query depth, entity exposure, type-safety
- `workflow-integration.md` — Elsa v3.5.3 activities, patterns

---

## Accessibility Patterns (Phase 4)

**WCAG 2.1 Level AA Compliance** | **65+ automated tests** | **Manual testing guide**

### Keyboard Navigation (40+ tests)

- Tab order: Logical, sequential progression through all interactive elements
- Arrow keys: Navigate within tabs (→/↓ next, ←/↑ previous, Home first, End last)
- Enter/Space: Activate buttons and form controls
- Escape: Close modals, dialogs, dropdown menus
- Focus management: Trap focus in modals, restore on close

**Utility:** `frontend/src/app/dashboard/a11y/keyboard-navigation.utils.ts`  
**Tests:** `frontend/src/app/dashboard/__tests__/keyboard-navigation.spec.ts`

### ARIA Compliance (23+ tests)

- Roles: `main`, `navigation`, `tablist`, `tab`, `tabpanel`, `status`, `alert`, `dialog`
- Attributes: `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-selected`, `aria-controls`, `aria-live`, `aria-atomic`, `aria-modal`, `aria-busy`, `aria-invalid`, `aria-required`
- Live regions: Announce real-time updates (status/error messages)
- Form labels: Associated via `<label for>` or `aria-label`

**Tests:** `frontend/src/app/dashboard/__tests__/aria-compliance.spec.ts`

### Landmark Regions

- `<main role="main">` with id="main"
- `<nav role="navigation">` with aria-label
- `<footer role="contentinfo">`
- `<aside role="complementary">` with aria-label
- Skip-to-main link as first focusable element

### Component Accessibility

**TabsComponent**: `role="tablist"`, `role="tab"` with `aria-selected`/`aria-controls`, `role="tabpanel"` with `aria-labelledby`; arrow keys + Home/End nav.

**ButtonComponent**: Semantic `<button>`, `aria-label`, `aria-busy="true"` when loading, `aria-disabled` matched to state.

**Form Inputs**: Each `<input>` requires `<label for>` or `aria-label`, plus `aria-describedby`, `aria-required`, `aria-invalid` as needed.

**Live Regions**: `role="status" aria-live="polite"` for updates, `role="alert" aria-live="assertive"` for errors.

**Testing** (`npm run test:a11y`, `test:keyboard`; `audit:lighthouse`, `audit:pa11y`; manual: `frontend/a11y/TESTING_CHECKLIST.md`)

### Compliance Status

✓ Keyboard nav 100% (42 tests) | ARIA 100% (23 tests) | Focus 100% | 4.5:1 contrast | 44x44px touch targets | See `frontend/a11y/A11Y_REPORT.md`
