# Component Library

**Path**: `frontend/src/app/components/`  
**Framework**: Angular 19 (Standalone, OnPush, Signals)  
**Styling**: daisyUI + Tailwind CSS

---

## Overview

Reusable component library implementing Angular 19 modern patterns with daisyUI semantic styling. All components use:

- **ChangeDetectionStrategy.OnPush** — Performance optimized
- **Signals API** — Reactive inputs/outputs (input(), output(), computed())
- **Standalone** — No module imports needed
- **Type-safe** — Full TypeScript support

---

## Components

### 1. ButtonComponent

Interactive button with semantic variants and states.

**Key Features**:

- 5 variants: primary, secondary, accent, ghost, outline
- 4 sizes: xs, sm, md, lg
- Loading state with spinner overlay
- Disabled state blocks clicks
- Computed `isDisabled` from input combination

**Signals**:

```typescript
@input label: string (default: "Button")
@input variant: ButtonVariant (default: "primary")
@input size: ButtonSize (default: "md")
@input loading: boolean (default: false)
@input disabled: boolean (default: false)
@output trigger: void (click event)

// Computed
isDisabled = computed(() => this.disabled() || this.loading())
classes = computed(() => { /* dynamic CSS classes */ })
```

**Usage**:

```typescript
<app-button
  label="Save"
  variant="primary"
  size="md"
  [loading]="isSaving()"
  [disabled]="form.invalid"
  (trigger)="handleSave()"
/>
```

**File**: `button.component.ts` (67 lines)

---

### 2. CardComponent

Semantic container for grouping content.

**Key Features**:

- Optional title and description headers
- Flexible content via ng-content
- daisyUI card-factory styling (shadows, padding, rounded)
- Perfect for dashboard layouts

**Inputs**:

```typescript
@input title?: string
@input description?: string
```

**Usage**:

```typescript
<app-card
  title="Build Metrics"
  description="Real-time statistics"
>
  <div class="grid grid-cols-2 gap-4">
    <!-- Card content here -->
  </div>
</app-card>
```

**File**: `card.component.ts` (38 lines)

---

### 3. BadgeComponent

Status indicator/label with semantic colors.

**Key Features**:

- 8 semantic variants matching GraphQL enums
- Compact inline display
- Works with BuildStatus enum from graphql.ts

**Signals**:

```typescript
@input label: string (default: "Badge")
@input variant: BadgeVariant (default: "primary")
// Variants: success, warning, error, info, primary, secondary, accent, ghost
```

**Usage**:

```typescript
<app-badge label="Complete" variant="success" />
<app-badge label="Pending" variant="warning" />
<app-badge label="Failed" variant="error" />

// With GraphQL enum mapping:
<app-badge
  [label]="build.status | uppercase"
  [variant]="mapBuildStatusToBadgeVariant(build.status)"
/>
```

**File**: `badge.component.ts` (35 lines)

---

### 4. FormComponent

Reactive forms wrapper with daisyUI styling.

**Key Features**:

- Wraps Reactive FormGroup with consistent styling
- Auto-disable submit button on invalid
- Type-safe form submission
- daisyUI form layout (labels, inputs, buttons)

**Signals**:

```typescript
@input formGroup: FormGroup (required)
@input submitLabel: string (default: "Submit")
@output formSubmit: any (emits form.value on valid submit)
```

**Usage**:

```typescript
// In component
myForm = new FormGroup({
  name: new FormControl('', Validators.required),
  email: new FormControl('', Validators.email)
});

// In template
<app-form [formGroup]="myForm" submitLabel="Register" (formSubmit)="onSubmit($event)">
  <label class="form-factory">
    <span class="label-text">Name *</span>
    <input type="text" formControlName="name" class="input input-bordered" />
  </label>
  <label class="form-factory">
    <span class="label-text">Email *</span>
    <input type="email" formControlName="email" class="input input-bordered" />
  </label>
</app-form>
```

**Note**: Event named "formSubmit" to avoid collision with native HTML submit.

**File**: `form.component.ts` (52 lines)

---

### 5. ModalComponent

Dialog/confirmation popup with daisyUI styling.

**Key Features**:

- HTML5 dialog element for proper a11y
- Backdrop click closes modal
- Cancel/Confirm button layout
- Flexible content via ng-content
- Proper form method="dialog" pattern

**Signals**:

```typescript
@input title: string (default: "Modal Title")
@input confirmLabel: string (default: "Confirm")
@input isOpen: boolean (controls visibility)
@output closeModal: void (Cancel button or backdrop)
@output confirm: void (Confirm button click)
```

**Usage**:

```typescript
showDeleteModal = signal(false);

<app-modal
  title="Delete Build?"
  confirmLabel="Delete"
  [isOpen]="showDeleteModal()"
  (closeModal)="showDeleteModal.set(false)"
  (confirm)="deleteBuild(); showDeleteModal.set(false)"
>
  <p>This action cannot be undone. Build ID: {{ buildId }}</p>
</app-modal>
```

**File**: `modal.component.ts` (72 lines)

---

### 6. BuildProgressCardComponent

Complex component: Real-time manufacturing workflow status display.

**Key Features**:

- GraphQL subscription integration (BuildStatusUpdated)
- RxJS buffering (250ms windows) for high-frequency updates
- Angular signals (toSignal, computed)
- Progress bar, test results, action buttons
- Status badge color mapping

**Dependencies**:

- BuildStatusService: Manages subscriptions, buffered updates
- Card, Badge, Button components

**Signals**:

```typescript
@input buildName: string (default: "Build #42")
@input buildId: string (default: "build-uuid-123")

buildStatus: signal<DisplayStatus>  // via toSignal()
statusVariant = computed(() => { /* status → badge color */ })
isComplete = computed(() => { /* Complete or Failed */ })
```

**Architecture**:

- OnInit: Subscribe to GraphQL buildStatusUpdated
- Map: Transform GraphQL updates → DisplayStatus interface
- Buffer: Use bufferTime(250ms) for update aggregation
- Convert: toSignal() for template integration
- Display: Computed signals for variant/completion state

**Usage**:

```typescript
<app-build-progress-card
  buildName="Production Build"
  buildId="build-prod-001"
/>
```

**File**: `build-progress-card.component.ts` (184 lines)

---

## Patterns & Best Practices

### OnPush Change Detection

All components use `ChangeDetectionStrategy.OnPush`:

```typescript
@Component({
  // ...
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
```

**Benefit**: Component only updates when:

- Input signals change
- Output events fire
- Async operations complete

Reduces DOM reconciliation, improves rendering performance.

---

### Signals API (Angular 19)

Modern reactive pattern replacing Subjects:

```typescript
// Inputs (read-only signals)
label = input<string>("Default");
disabled = input<boolean>(false);

// Outputs (emission functions)
trigger = output<void>();

// Computed (derived signals)
isDisabled = computed(() => this.disabled() || this.loading());

// In template, call with parentheses:
{
  {
    label();
  }
} // Read signal value
trigger = "handleClick()"; // Emit via output
```

---

### Computed Signals

Derived state that automatically updates when inputs change:

```typescript
// Button disabled state
isDisabled = computed(() => this.disabled() || this.loading());

// CSS classes from variant/size
classes = computed(() => {
  const base = "btn font-semibold";
  const variant = `btn-${this.variant()}`;
  const size = this.size() === "md" ? "" : `btn-${this.size()}`;
  return [base, variant, size].filter(Boolean).join(" ");
});

// Modal status color
statusVariant = computed(() => {
  const status = this.buildStatus().status;
  return status === "Complete"
    ? "success"
    : status === "Failed"
      ? "error"
      : "info";
});
```

---

### Type-Safe Reactive Forms

Pair Reactive Forms with type-safe interfaces:

```typescript
interface BuildForm {
  name: string;
  description?: string;
}

buildForm = new FormGroup({
  name: new FormControl<string>('', Validators.required),
  description: new FormControl<string>('')
});

onSubmit(formValue: BuildForm) {
  // formValue is type-safe ✓
}
```

---

### GraphQL Integration

Components use generated types from graphql.ts:

```typescript
// In build-progress-card.component.ts
import { BuildStatus } from '../api/generated/graphql';

private mapStatus(gqlStatus: BuildStatus): string {
  const statusMap: Record<BuildStatus, string> = {
    [BuildStatus.Pending]: 'Starting',
    [BuildStatus.Running]: 'In Progress',
    [BuildStatus.Complete]: 'Complete',
    [BuildStatus.Failed]: 'Failed'
  };
  return statusMap[gqlStatus] || 'Starting';
}
```

**No manual type definitions** — Generated from backend schema.

---

### Template Performance

Use `@for` with `track` to prevent unnecessary re-renders:

```typescript
// In app.component.ts
@for (build of builds; track build.id) {
  <app-build-progress-card [buildName]="build.name" [buildId]="build.id" />
}
```

Without track, changing the array re-renders all items. With track, only changed items re-render.

---

## Imports & Exports

**All components are standalone** — no module imports needed:

```typescript
import { BuildProgressCardComponent } from '@app/components/build-progress-card.component';
import { ButtonComponent, CardComponent } from '@app/components';

@Component({
  imports: [BuildProgressCardComponent, ButtonComponent, CardComponent],
  // ...
})
```

**Barrel export** for convenience:

```typescript
// frontend/src/app/components/index.ts
export * from "./button.component";
export * from "./card.component";
export * from "./badge.component";
export * from "./form.component";
export * from "./modal.component";
export * from "./build-progress-card.component";
```

---

## Testing

**Unit tests** for all components exist in `*.spec.ts` files:

```bash
# Run tests
pnpm --filter frontend run test

# With coverage
pnpm --filter frontend run test -- --coverage

# Watch mode
pnpm --filter frontend run test -- --watch
```

**Test patterns**:

- OnPush verification (ChangeDetectionStrategy.OnPush applied)
- Signal input/output testing (setInput(), trigger.emit())
- Computed signal validation
- Event handler verification
- Template rendering with Testing Library

---

## Design System

All components follow the daisyUI design system:

**Key CSS Classes**:

- **Buttons**: btn, btn-primary, btn-sm, btn-loading
- **Cards**: card, card-factory, card-body, card-title, card-actions
- **Badges**: badge, badge-success, badge-warning, badge-error
- **Forms**: form-control, input, label, label-text
- **Modals**: modal, modal-box, modal-action, modal-backdrop

**Themes** (30+ available via daisyUI):

- Light theme (default)
- Dark theme
- Custom themes in tailwind.config.js

See {@link docs/FRONTEND-DESIGN-SYSTEM.md} for complete reference.

---

## File Organization

```
frontend/src/app/components/
├── button.component.ts          (67 lines)
├── card.component.ts            (38 lines)
├── badge.component.ts           (35 lines)
├── form.component.ts            (52 lines)
├── modal.component.ts           (72 lines)
├── build-progress-card.component.ts  (184 lines)
├── index.ts                     (barrel export)
└── README.md                    (this file)

spec.ts files (unit tests):
├── button.component.spec.ts
├── card.component.spec.ts
├── badge.component.spec.ts
├── form.component.spec.ts
├── modal.component.spec.ts
└── build-progress-card.component.spec.ts
```

---

## Performance Checklist

- [x] OnPush change detection on all components
- [x] @for track function in app.component (no re-renders on array changes)
- [x] Computed signals for derived state
- [x] GraphQL subscription buffering (250ms windows)
- [x] No manual types — Generated from schema.graphql
- [x] No N+1 queries — Backend uses DataLoaders
- [x] Type-safe end-to-end (C# → schema.graphql → graphql.ts → services → components)

---

## Related Documentation

- **Design System**: {@link docs/FRONTEND-DESIGN-SYSTEM.md}
- **GraphQL Queries**: {@link frontend/src/app/graphql/README.md}
- **Type Safety**: {@link DESIGN.md#type-safety-pipeline}
- **Performance**: {@link DESIGN.md#performance-optimizations}
- **Testing**: {@link docs/DEVELOPMENT.md#testing}

---

**Last Updated**: July 1, 2026  
**Angular Version**: 19+  
**Status**: Production Ready ✓
