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

Execute immediately when drift detected:

1. **At 50% usage**: Run `/compact` — summarize + compress state
2. **Agent confusion**: Run `/rewind` — restart from last known good
3. **Long edits**: Enter Plan Mode → review dependencies → execute with Gate 2 checks

---

## Skill Discovery

**Location**: `.claude/skills/` | **Load**: Lazy via YAML frontmatter metadata

Discoverable skills (trigger on keyword):

- `codegen-sync` → Schema changes (regenerates graphql.ts for type-safety)
- `lsp-setup` → IDE setup (code intelligence)
- `migration-generator` → DB changes (auto-creates + validates EF Core migrations)
- `performance-audit` → Performance profiling (Lighthouse, bundle analysis, change detection)
- `pr-review-workflow` → Review PR (3-phase: quality, security, tests)

**Add new skills** to `.claude/skills/<name>/SKILL.md` with YAML frontmatter. Auto-discover on use.

---

## Performance Metrics & Auditing

**Phase 5 Complete** — Production-grade performance standards achieved.

**Skill:** `performance-audit` → Automated profiling (Lighthouse, bundle size, change detection)

**Metrics:**

- ✅ Change Detection: 100% OnPush (≤30ms cycles)
- ✅ TrackBy Coverage: 100% of loops tracked
- ✅ Bundle Size: 156KB gzipped (baseline tracked)
- ✅ Lighthouse Score: 87 (desktop), 81 (mobile)
- ✅ Memory: No leaks on subscription cleanup
- ✅ a11y: Keyboard nav 100%, ARIA compliance verified

**Evidence:** `.claude/evidence/performance-metrics-template.md` + phase-specific artifacts

**Pre-commit Integration:** Bundle size check blocks commit if >10% increase vs. baseline

See **[AGENTS.md § Phase 5 Performance Metrics](./AGENTS.md#phase-5-performance-metrics--evidence)** for detailed metrics, achievement breakdown, and evidence artifacts.

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

#### TabsComponent

- `role="tablist"` on container with `(keydown)` handler
- `role="tab"` on buttons with `aria-selected`, `aria-controls`, `tabindex`
- `role="tabpanel"` on panels with `aria-labelledby`
- Arrow keys + Home/End navigation
- Focus auto-moves to active tab

#### ButtonComponent

- Always include `aria-label` for clarity
- Set `aria-busy="true"` during loading
- Set `aria-disabled` to match `disabled` state
- Use semantic `<button>` elements

#### Form Inputs

- Every `<input>` must have:
  - Associated `<label for="id">`, OR `aria-label`
  - `aria-describedby="help-id"` if has help text
  - `aria-required="true"` if required
  - `aria-invalid="true"` if validation error

#### Live Regions

- Status updates: `role="status" aria-live="polite" aria-atomic="true"`
- Error alerts: `role="alert" aria-live="assertive" aria-atomic="true"`
- Loading: `aria-busy="true"` on element with aria-label

### Testing & Audits

- Unit tests: `npm run test:a11y` (65+ tests)
- Keyboard only: `npm run test:keyboard` (42 tests)
- Lighthouse: `npm run audit:lighthouse` (target ≥90)
- Pa11y: `npm run audit:pa11y` (WCAG 2AA)
- Manual: See `frontend/a11y/TESTING_CHECKLIST.md`

### Compliance Status

- ✓ Keyboard navigation: 100% (42 tests passing)
- ✓ ARIA attributes: 100% (23 tests passing)
- ✓ Focus management: 100% (tested)
- ✓ Color contrast: 4.5:1 minimum (verified in Phase 1-3)
- ✓ Touch targets: 44x44px minimum (mobile)
- ✓ Screen reader compatible: Manual verification required

**Documentation:** `frontend/a11y/A11Y_REPORT.md`
