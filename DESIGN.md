# Design & Architecture Guide

**Updated**: July 1, 2026  
**Format**: Claude Code CLI session reference — self-contained, copy-paste ready  
**Architecture**: Angular 19 | daisyUI + Tailwind | GraphQL + Type Safety

> **See also**: [CLAUDE.md](./CLAUDE.md) for behavior rules, testing patterns, and issue dependencies. DESIGN.md focuses on visual consistency + constraints; CLAUDE.md covers behavior + testing + phase ordering.

---

## Product Narrative

**ng-graphql-playground** is a full-stack manufacturing workflow management system with real-time telemetry, long-running Elsa orchestration, and type-safe GraphQL API.

**Visual Philosophy**: Clean, data-dense dashboard (daisyUI + Tailwind) with high-frequency updates (250ms buffers) and zero flicker on subscription events. Every component prioritizes performance (OnPush change detection) and accessibility (semantic HTML, ARIA labels).

---

## Semantic Token Definitions

### Colors

| Token         | Value            | Intent                | Use When                        | Never When                  |
| ------------- | ---------------- | --------------------- | ------------------------------- | --------------------------- |
| `primary`     | `#2563eb` (blue) | Primary actions, CTAs | Buttons, links, active states   | Background fills, text body |
| `surface`     | `#ffffff`        | Container backgrounds | Cards, modals, forms            | Text, borders               |
| `surface-dim` | `#f3f4f6`        | Subtle backgrounds    | Disabled states, hover          | High contrast text          |
| `text-muted`  | `#6b7280`        | Secondary text        | Helper text, labels             | Buttons, headings           |
| `success`     | `#10b981`        | Positive feedback     | Status badges, success messages | Error states                |
| `warning`     | `#f59e0b`        | Caution               | Warning badges, alert icons     | Success states              |
| `error`       | `#ef4444`        | Error states          | Error badges, validation        | Normal states               |

### Spacing

| Token             | Value    | Intent                 | Use When                     |
| ----------------- | -------- | ---------------------- | ---------------------------- |
| `section-gap`     | `6rem`   | Major section dividers | Between major content blocks |
| `card-gap`        | `1.5rem` | Card spacing           | Padding inside cards         |
| `density-compact` | `0.5rem` | Tight spacing          | List items, badges           |

### Radius

| Token           | Value  | Intent             | Use When        |
| --------------- | ------ | ------------------ | --------------- |
| `radius-card`   | `8px`  | Card corners       | Cards, modals   |
| `radius-button` | `4px`  | Button corners     | Buttons, inputs |
| `radius-badge`  | `12px` | Badge/pill corners | Badges, tags    |

---

## Constraints & Boundaries

- **Max nesting depth**: 3 levels (prevent over-complex layouts)
- **Component composition**: Always `ChangeDetectionStrategy.OnPush` + `trackBy` (mandatory)
- **Subscription update frequency**: ≤250ms buffer (prevent jank on high-frequency updates)
- **Typography**: Max line length 80 characters (readability on dense data tables)
- **Query complexity**: Max 5 GraphQL nesting layers (split deeper into separate requests)

---

## ⚡ STATUS & DELIVERABLES (START HERE)

### What's Complete ✅

| Deliverable                     | Status      | Details                                                    |
| ------------------------------- | ----------- | ---------------------------------------------------------- |
| **7/7 components have OnPush**  | ✅ COMPLETE | app, build-progress-card, button, card, badge, form, modal |
| **app.component loop tracking** | ✅ COMPLETE | @for with track prevents re-renders                        |
| **6/7 component unit tests**    | ✅ COMPLETE | .spec.ts files created, >60% coverage                      |
| **Type safety pipeline**        | ✅ COMPLETE | graphql.ts auto-generated + in use                         |
| **Design system**               | ✅ COMPLETE | daisyUI + Tailwind fully configured (7 components)         |
| **E2E tests**                   | ✅ COMPLETE | Playwright subscriptions.spec.ts operational               |
| **RxJS buffering**              | ✅ COMPLETE | bufferTime(250) implemented on subscriptions               |
| **GraphQL codegen**             | ✅ COMPLETE | build.graphql + codegen.ts configured                      |

### Overall Progress: 100% (All 5 Phases Complete)

Next action: Deploy to production. Backend features (#148-149) ready to proceed in parallel.

---

## Implementation Status

**Issue #47** (Frontend Architecture Fixes) — ✅ COMPLETE

All 5 phases delivered:

1. **Phase 1: Architecture Fixes** (OnPush + Loop Tracking) — ✅ COMPLETE
2. **Phase 2: Type Safety** (Remove Manual Types) — ✅ COMPLETE
3. **Phase 3: Test Coverage** (Component Unit Tests) — ✅ COMPLETE
4. **Phase 4: Performance Audit** (Lighthouse + N+1 check) — ✅ COMPLETE
5. **Phase 5: Documentation** (JSDoc + Design Patterns) — ✅ COMPLETE

**Related Issues**: #48-51 (sub-issue tracking), #145 (backend roadmap)

---

## 🔧 COPY-PASTE REFERENCE (Quick Wins)

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

### Phase 1: Architecture Fixes (BLOCKING) — 30 min — ✅ COMPLETE

**Deliverables**: OnPush strategy + loop tracking on all components

1. ✅ Add `ChangeDetectionStrategy.OnPush` to 7 components
2. ✅ Refactor app.component grid with @for tracking
3. ✅ Build & test passing
4. ✅ Visual regression verified

**Related Issue**: #47, #50

---

### Phase 2: Type Safety — 1 hour — ✅ COMPLETE

**Deliverables**: Remove manual types, use generated graphql.ts

1. ✅ Remove manual BuildStatus interfaces
2. ✅ Import types from generated graphql.ts
3. ✅ Apollo service layer consistent
4. ✅ TypeScript compilation verified

**Related Issue**: #47, #49

---

### Phase 3: Test Coverage — 3 hours — ✅ COMPLETE

**Deliverables**: Component unit tests, >60% coverage

1. ✅ Create .spec.ts for 6/7 components
2. ✅ Achieve >60% overall coverage
3. ✅ >80% coverage on critical paths
4. ✅ All tests passing in CI

**Related Issue**: #47, #51

---

### Phase 4: Performance Audit — 1 hour — ✅ COMPLETE

**Deliverables**: Verify performance, audit queries

1. ✅ Verify `bufferTime(250)` on all subscriptions
2. ✅ Lighthouse Performance ≥85
3. ✅ No N+1 queries in build.graphql
4. ✅ DataLoader patterns verified

**Related Issue**: #47, #50

---

### Phase 5: Documentation — 1 hour — ✅ COMPLETE

**Deliverables**: JSDoc comments, design patterns, guides

1. ✅ Add JSDoc to all components (link to generated types)
2. ✅ Document build.graphql query structure
3. ✅ Update design system guide (docs/FRONTEND-DESIGN-SYSTEM.md)
4. ✅ Update implementation patterns

**Related Issue**: #47

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

## Related Issues & Implementation Tracking

**DESIGN.md covers visual/UI guidance and implementation patterns.** For detailed status, see:

### Frontend Implementation

- **[Issue #47: Frontend Architecture Fixes](https://github.com/pluto-atom-4/ng-graphql-showcase/issues/47)** — ✅ All 5 phases complete: OnPush, Type Safety, Tests, Performance, Docs
- **[Issue #50: Performance Optimization](https://github.com/pluto-atom-4/ng-graphql-showcase/issues/50)** — OnPush + Loop Tracking details
- **Sub-issues**: #48-51 (specific frontend work)

### Backend Implementation

- **[Issue #145: Advanced Features Roadmap](https://github.com/pluto-atom-4/ng-graphql-showcase/issues/145)** — Query limits (#146 ✅), Rate limiting (#147), Authorization (#148), Workflows (#149)
- **Recommended order**: #148 (Auth) → #149 (Workflows) → #147 (Rate Limiting)

### Design System Reference

- **[docs/FRONTEND-DESIGN-SYSTEM.md](./docs/FRONTEND-DESIGN-SYSTEM.md)** — Components, patterns, theming
- **[.claude/rules/](./claude/rules/)** — Backend patterns, transactions, DataLoaders

---

**Last Updated**: July 12, 2026  
**Purpose**: Visual/UI design guidance + implementation patterns  
**Status**: Frontend ✅ 100% complete (#47 all phases), Backend features ready for integration (#145-149)
