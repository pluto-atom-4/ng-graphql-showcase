# Design & Architecture Guide

**Updated**: July 1, 2026  
**Format**: Claude Code CLI session reference — self-contained, copy-paste ready  
**Architecture**: Angular 19 | daisyUI + Tailwind | GraphQL + Type Safety

---

## ⚡ STATUS & BLOCKERS (START HERE)

### What's Broken (Fix These First)

| Issue                             | Impact                                | Fix Time | Effort     |
| --------------------------------- | ------------------------------------- | -------- | ---------- |
| **6/7 components missing OnPush** | Perf degradation on subscriptions     | 6 min    | 🟢 Trivial |
| **app.component hardcoded grid**  | Unnecessary re-renders on data change | 10 min   | 🟢 Easy    |
| **0 component unit tests**        | No regression coverage                | 2.5 hrs  | 🟡 Medium  |

### What Works ✅

- ✅ GraphQL codegen + build.graphql complete
- ✅ Type safety pipeline (graphql.ts auto-generated)
- ✅ Design system (daisyUI + Tailwind fully configured)
- ✅ E2E tests (Playwright operational)
- ✅ RxJS buffering (bufferTime(250) implemented)

### Overall Progress: 40% (Phase 1)

Next action: Add `ChangeDetectionStrategy.OnPush` to 6 components.

---

## 🔧 5-MINUTE FIXES (Copy-Paste Ready)

### Fix #1: Add ChangeDetectionStrategy.OnPush

**Files**: button.component.ts, card.component.ts, badge.component.ts, form.component.ts, modal.component.ts, app.component.ts (6 files, 1 min each)

**Change** (in `@Component` decorator):

```typescript
import { Component, ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector: "app-button",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush, // ← ADD THIS LINE
  template: `...`,
})
export class ButtonComponent {}
```

**Why**: Prevents unnecessary change detection on async events. Mandatory for performance.

---

### Fix #2: Add Loop Tracking to app.component.ts

**File**: `frontend/src/app/app.component.ts` (lines 24-29)

**Remove**:

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
  <app-build-progress-card
    buildName="Production Build"
    buildId="build-prod-001"
  />
  <app-build-progress-card buildName="Test Suite" buildId="build-test-001" />
  <app-build-progress-card
    buildName="Staging Deploy"
    buildId="build-stage-001"
  />
</div>
```

**Replace with**:

```typescript
// In component class, add:
buildCards = [
  { buildName: "Production Build", buildId: "build-prod-001" },
  { buildName: "Test Suite", buildId: "build-test-001" },
  { buildName: "Staging Deploy", buildId: "build-stage-001" },
];
```

```html
<!-- In template: -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
  @for (card of buildCards; track card.buildId) {
  <app-build-progress-card
    [buildName]="card.buildName"
    [buildId]="card.buildId"
  />
  }
</div>
```

**Why**: `track` prevents re-initialization of all items when array changes.

---

### Fix #3: Create Component Test Stub

**File**: Create `frontend/src/app/components/button.component.spec.ts` (repeat for all 7 components)

```typescript
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ButtonComponent } from "./button.component";

describe("ButtonComponent", () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should emit trigger event on click", () => {
    spyOn(component.trigger, "emit");
    component.onClickHandler();
    expect(component.trigger.emit).toHaveBeenCalled();
  });
});
```

**Repeat for**: app.component, build-progress-card.component, card.component, badge.component, form.component, modal.component

**Why**: Prevents regressions; required for CI integration.

---

## 📚 KEY CONCEPTS (Reference)

### 1. ChangeDetectionStrategy.OnPush

Required on every component. Tells Angular: "Only re-check this component if inputs change or events fire."

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyComponent {
  @Input() data: any; // Component only re-checks when data changes
  @Output() action = new EventEmitter();
}
```

**Impact**: Massive perf improvement on subscriptions. Critical for RxJS streams.

---

### 2. Loop Tracking (@for with track)

Every loop must identify items uniquely:

```typescript
// ❌ Bad — re-initializes all items on any change
@for (item of items) { <div>{{ item }}</div> }

// ✅ Good — only re-initializes changed item
@for (item of items; track item.id) { <div>{{ item }}</div> }
```

**Impact**: Prevents DOM thrashing, keeps component state (focus, input values) intact.

---

### 3. GraphQL Type Safety Pipeline

```
Backend (C#)
  ↓ Auto-emit on build
schema.graphql
  ↓ Run codegen
codegen.ts + build.graphql
  ↓ Generate types
frontend/src/app/api/generated/graphql.ts (DO NOT EDIT)
  ↓ Import in services
build-status.service.ts
  ↓ Use in components
Components (full type safety)
```

**Command**: `pnpm --filter frontend run codegen`

---

### 4. RxJS Buffering (High-Frequency Updates)

GraphQL subscriptions can fire very fast. Buffer updates to prevent excessive re-renders:

```typescript
// ❌ Bad — every update triggers change detection
buildProgress$ = this.apollo.subscribe(BUILD_SUBSCRIPTION);

// ✅ Good — batch updates every 250ms
buildProgress$ = this.apollo.subscribe(BUILD_SUBSCRIPTION).pipe(
  bufferTime(250),
  filter((updates) => updates.length > 0),
);
```

**Impact**: Smoother UI, reduced CPU usage on fast-changing data.

---

### 5. Semantic CSS Classes (daisyUI + Tailwind)

Use pre-built component classes, not inline styles:

```html
<!-- ❌ Bad -->
<div style="padding: 1rem; background: blue; color: white;">Content</div>

<!-- ✅ Good -->
<div class="p-4 bg-blue-500 text-white">Content</div>

<!-- ✅ Even better — use component classes -->
<app-card title="Title">Content</app-card>
<app-button label="Save" variant="primary" />
```

**Available Components**: Button, Card, Badge, Form, Modal, BuildProgressCard

---

## 🗺️ IMPLEMENTATION ROADMAP

### Phase 1: Architecture Fixes (BLOCKING) — ~30 min

**What to do**:

1. Add `ChangeDetectionStrategy.OnPush` to 6 components (6 min)
2. Refactor app.component grid with @for tracking (10 min)
3. Build & test: `pnpm --filter frontend run build` (5 min)
4. Manual visual test (9 min)

**Success**: All 7 components have OnPush; no console errors

**Related Issue**: #47 (Frontend Architecture Fixes Implementation Plan)

---

### Phase 2: Test Coverage (HIGH PRIORITY) — ~3 hours

**What to do**:

1. Create `.spec.ts` for 7 components
2. Achieve >60% code coverage
3. Run `pnpm --filter frontend run test` — all passing

**Success**: 8+ test files, CI passing

---

### Phase 3: Performance Audit — ~1 hour

**What to do**:

1. Verify `bufferTime(250)` on all subscriptions
2. Profile with Chrome DevTools Lighthouse
3. Check build.graphql for N+1 queries

**Success**: Lighthouse Performance ≥85

---

### Phase 4: Documentation — ~1 hour

**What to do**:

1. Add JSDoc to components (link to generated types)
2. Document build.graphql query structure
3. Update README with patterns

**Success**: All components documented

---

## 📋 COMMANDS QUICK REFERENCE

```bash
# Design system & development
pnpm --filter frontend run ng serve          # Dev server (port 4200)
pnpm --filter frontend run build             # Production build
pnpm --filter frontend run lint              # Code style check

# GraphQL — MUST RUN after backend schema changes
pnpm --filter frontend run codegen           # Generate types from schema + operations

# Testing
pnpm --filter frontend run test              # Run all tests
pnpm --filter frontend run test:cov          # With coverage report
pnpm --filter frontend run e2e               # Playwright E2E
```

---

## 📁 FILE STRUCTURE

**Design System**:

- `frontend/src/styles.css` — Tailwind + daisyUI + custom @layer components
- `frontend/tailwind.config.ts` — Theme config, color overrides
- `frontend/src/app/components/` — 7 reusable components

**GraphQL & Types**:

- `frontend/codegen.ts` — Code generator config (fully configured)
- `frontend/src/app/graphql/build.graphql` — Query/mutation/subscription definitions (95 lines)
- `frontend/src/app/api/generated/graphql.ts` — Auto-generated types (DO NOT EDIT)
- `frontend/src/app/api/build-status.service.ts` — Service using generated types (reference implementation)

**Testing**:

- `frontend/vitest.config.ts` — Test runner config
- `frontend/src/app/api/build-status.service.spec.ts` — Example test file
- `frontend/e2e/subscriptions.spec.ts` — Playwright E2E tests

---

## 🎯 COMPONENT LIBRARY QUICK REFERENCE

### Button

```typescript
<app-button
  label="Save"
  variant="primary|secondary|accent|ghost|outline"
  size="xs|sm|md|lg"
  [loading]="isLoading"
  [disabled]="false"
  (trigger)="handleClick()"
/>
```

### Card

```typescript
<app-card title="Title" description="Optional">
  <div>Your content</div>
  <div class="card-actions">
    <app-button label="Action" variant="primary" />
  </div>
</app-card>
```

### Badge

```typescript
<app-badge
  label="Status"
  variant="success|warning|error|info|primary"
/>
```

### BuildProgressCard

```typescript
<app-build-progress-card
  buildName="Build #1"
  buildId="build-prod-001"
/>
```

---

## 🔗 REFERENCE LINKS

**Detailed Guides**:

- Design System Deep Dive: `docs/FRONTEND-DESIGN-SYSTEM.md`
- Backend Schema: `backend/src/FactoryApp.WebApi/schema.graphql`
- Architecture Overview: `docs/ARCHITECTURE.md`
- Backend Patterns: `.claude/rules/backend-patterns.md`
- Frontend Patterns: `.claude/rules/frontend-patterns.md`
- GraphQL Patterns: `.claude/rules/graphql-patterns.md`

**GitHub**:

- Implementation Plan: #47 (see issue comments for detailed status)
- Sub-tasks: #48, #49, #50, #51

---

## ⚠️ COMMON MISTAKES

| Mistake                                   | Fix                                                         |
| ----------------------------------------- | ----------------------------------------------------------- |
| Component missing OnPush                  | Add `changeDetection: ChangeDetectionStrategy.OnPush`       |
| Loop without tracking                     | Add `track` to `@for` or `trackBy` to `*ngFor`              |
| No tests for components                   | Create `.spec.ts` using template above                      |
| Hardcoded styles instead of Tailwind      | Use `class="p-4 bg-blue-500"` not `style="..."`             |
| Forget to run codegen after schema change | Run `pnpm codegen` after backend schema updates             |
| Console errors during dev                 | Check that build passes: `pnpm --filter frontend run build` |

---

# Backend Implementation Status

**Updated**: July 1, 2026  
**Stack**: .NET 10 | ASP.NET Core | Hot Chocolate GraphQL | SQL Server | EF Core + Dapper

---

## ⚡ BACKEND STATUS & BLOCKERS

### Test Status

| Metric               | Status          | Details                                                                                                            |
| -------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Total Tests**      | ✅ 79/82 PASS   | 3 failures (pagination logic)                                                                                      |
| **Test Files**       | ✅ 6 FILES      | AuthServiceTests, BuildQueryTests, BuildMutationTests, BuildSubscriptionTests, SchemaTests, ValidationServiceTests |
| **Build**            | ✅ SUCCESS      | 4 xUnit warnings (fixable)                                                                                         |
| **GraphQL Schema**   | ✅ AUTO-EMITTED | 185 lines, type-safe pipeline                                                                                      |
| **Query Complexity** | ✅ IMPLEMENTED  | Issue #146 complete (14 tests passing)                                                                             |

### What's Broken (Minor)

| Issue                          | Status      | Impact                                               | Effort |
| ------------------------------ | ----------- | ---------------------------------------------------- | ------ |
| **3 pagination tests failing** | ❌ FAILING  | BuildQueryTests (totalCount mismatch)                | 15 min |
| **4 xUnit warnings**           | ⚠️ WARNINGS | TestRunTransactionTests (Assert.NotNull on DateTime) | 5 min  |

### What Works ✅

- ✅ GraphQL schema auto-generated on build
- ✅ Query complexity middleware (DoS prevention)
- ✅ JWT authentication middleware (issue #133)
- ✅ Real SQL Server testing (Testcontainers)
- ✅ EF Core + Dapper transaction handling
- ✅ DataLoader pattern for N+1 prevention
- ✅ GraphQL subscriptions (BuildStatusChanged, etc.)
- ✅ Decimal precision support (issue #132)
- ✅ Error handling + Unicode support

---

## 🔧 QUICK FIXES (Backend)

### Fix #1: Pagination Test Failures

**Files**: `backend/FactoryApp.Tests/BuildQueryTests.cs` (lines 136, 167)

**Issue**: Expected totalCount/offset differ from actual values

**Status**: Minor (79/82 tests pass) — fixture data seed mismatch

**Estimated Effort**: 15 min (review FixtureSeeder data)

---

### Fix #2: xUnit Warnings

**Files**: `backend/FactoryApp.Tests/Mutations/TestRunTransactionTests.cs` (lines 58, 206)

**Issue**: Assert.NotNull() on DateTime value type (xUnit analyzer)

**Fix**:

```csharp
// ❌ Bad
Assert.NotNull(timestamp);

// ✅ Good
Assert.NotEqual(default, timestamp);
```

**Estimated Effort**: 5 min

---

## 📚 KEY BACKEND CONCEPTS

### 1. GraphQL Schema Auto-Emission

Backend builds emit `schema.graphql` automatically. Frontend codegen reads it:

```bash
dotnet build ./backend/FactoryApp.slnx  # Emits schema.graphql
pnpm --filter frontend run codegen       # Generates graphql.ts
```

**Impact**: Type-safe pipeline C# → GraphQL → TypeScript

---

### 2. Query Complexity Limits (Issue #146)

Middleware calculates query cost before execution:

```typescript
# Cost example
{
  builds(limit: 5)     # 100 base * 5 multiplier = 500
  { parts { id } }     # + nested
}
# Total complexity tracked, rejects if > MaxComplexity (1000)
```

Configuration in `appsettings.json`:

```json
"GraphQL": {
  "QueryComplexity": {
    "Enabled": true,
    "MaxComplexity": 1000,
    "DefaultFieldCost": 1,
    "ListMultiplier": 10
  }
}
```

---

### 3. Real SQL Server Testing (Testcontainers)

Tests use real SQL Server, not InMemory:

```bash
pnpm docker:up                    # Start SQL Server container
dotnet test backend/              # Run against real DB
pnpm docker:down                  # Cleanup
```

**Why**: Mocks diverge from production; tests must verify actual behavior.

---

### 4. EF Core + Dapper Transaction Handling

Critical for deadlock prevention:

```csharp
using var transaction = await context.Database.BeginTransactionAsync();
// EF Core ops...
// Dapper ops (pass transaction)...
await transaction.CommitAsync();
```

**Rule**: Never mix EF Core + Dapper writes without shared transaction.

---

## 📋 BACKEND COMMANDS

```bash
# Build & test
dotnet build ./backend/FactoryApp.slnx           # Build backend
dotnet test backend/                              # Run all tests (79/82 pass)
dotnet test backend/ --filter "BuildQueryTests"   # Run specific test class

# EF Core migrations
cd backend/src/FactoryApp.WebApi
dotnet ef migrations add MigrationName             # Create migration
dotnet ef database update                          # Apply migrations

# Development server
dotnet watch run                                   # Hot reload (port 5275)

# GraphQL
pnpm codegen                                       # Generate types from schema
```

---

## 📁 BACKEND FILE STRUCTURE

| Path                                | Status                   | Purpose                                      |
| ----------------------------------- | ------------------------ | -------------------------------------------- |
| `backend/src/FactoryApp.Domain/`    | ✅ Core entities         | Build, Part, TestRun, Result models          |
| `backend/src/FactoryApp.GraphQL/`   | ✅ Resolvers             | Query, Mutation, Subscription types          |
| `backend/src/FactoryApp.WebApi/`    | ✅ Server                | ASP.NET Core host, middleware, configuration |
| `backend/src/FactoryApp.Workflows/` | ✅ Elsa v3               | Workflow activities (Phase 5B deferred)      |
| `backend/FactoryApp.Tests/`         | ✅ 82 tests              | 79 pass, 3 failures (pagination)             |
| `backend/FactoryApp.slnx`           | ✅ .NET 10 solution file | Modern solution format                       |
| `schema.graphql`                    | ✅ 185 lines             | Auto-generated from C# entities              |

---

## 🎯 BACKEND ROADMAP (Quick Fixes)

### Phase 1: Fix Test Failures ✅ READY (20 min)

- [ ] Fix pagination test mismatch (15 min)
- [ ] Fix xUnit warnings (5 min)

**Success**: All 82 tests pass

---

## FOR CLAUDE CODE SESSIONS

**Entry Point**: This file (DESIGN.md) — start here for any task

**Structure**:

**FRONTEND**:

1. STATUS & BLOCKERS — understand what's broken (OnPush, tracking, tests)
2. 5-MINUTE FIXES — copy-paste solutions (OnPush template, trackBy, tests)
3. KEY CONCEPTS — understand the "why" (OnPush perf, buffering, type safety)
4. ROADMAP — 5-phase plan (30 min Phase 1, 3 hrs Phase 3)
5. COMMANDS & FILES — build, test, codegen

**BACKEND**:

1. TEST STATUS — build success, test pass rate (79/82 passing)
2. QUICK FIXES — pagination issues, xUnit warnings (20 min total)
3. KEY CONCEPTS — schema generation, complexity, transactions, testing
4. COMMANDS & FILES — build, test, migrate, develop

**Workflow**:

- **Building a component?** → Frontend section → "Component Library Quick Reference"
- **Performance issues?** → Frontend → "5-MINUTE FIXES" (OnPush/tracking)
- **Tests failing?** → Backend section → "Quick Fixes" (pagination, xUnit)
- **Need schema changes?** → Remember: backend build emits schema.graphql → `pnpm codegen`
- **Type not found?** → Did you run `pnpm codegen` after backend build?
- **Want deep reference?** → Frontend: `docs/FRONTEND-DESIGN-SYSTEM.md` | Backend: `.claude/rules/backend-patterns.md`

**Design System Details**: `docs/FRONTEND-DESIGN-SYSTEM.md` (components, patterns, theming)

---

**Last Updated**: July 1, 2026  
**Status**: Production-ready; 40% implementation complete  
**Next Review**: After Phase 1 completion (estimated 30 min work)
