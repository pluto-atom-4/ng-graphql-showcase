# Frontend Design System (daisyUI + Tailwind CSS)

**Updated**: July 1, 2026  
**Version**: 1.0  
**Framework**: Angular 19+ | Standalone Components | Type-Safe

---

## Overview

Semantic component library built on daisyUI + Tailwind CSS. 30+ pre-built themes, no external design tools needed. Components are standalone, reusable, fully typed.

---

## Component Library

### Quick Reference

| Component                    | Purpose                   | Key Props                               | Variants                                   |
| ---------------------------- | ------------------------- | --------------------------------------- | ------------------------------------------ |
| `ButtonComponent`            | Interactive actions       | label, variant, size, loading, disabled | primary, secondary, accent, ghost, outline |
| `CardComponent`              | Content containers        | title, description                      | card-factory, card-compact                 |
| `BadgeComponent`             | Status/labels             | label, variant                          | success, warning, error, info, primary     |
| `FormComponent`              | Reactive forms wrapper    | formGroup, onSubmit                     | N/A                                        |
| `ModalComponent`             | Dialogs/confirmations     | title, isOpen, onConfirm                | N/A                                        |
| `BuildProgressCardComponent` | Real-time workflow status | buildName, buildId                      | N/A (complex component)                    |

### Usage Examples

**Button**:

```typescript
import { ButtonComponent } from '@app/components';

<app-button
  label="Save"
  variant="primary"
  size="md"
  [loading]="isSaving"
  (trigger)="handleSave()"
/>
```

**Card**:

```typescript
<app-card title="Build Status" description="Real-time updates">
  <div class="space-y-4">
    <p>Content here</p>
    <app-button label="Action" variant="primary" />
  </div>
</app-card>
```

**Badge**:

```typescript
<app-badge label="Active" variant="success" />
<app-badge label="Pending" variant="warning" />
```

---

## Semantic CSS Classes (Tailwind + daisyUI)

### Buttons

```html
<!-- Variants -->
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-accent">Accent</button>
<button class="btn btn-ghost">Ghost (transparent)</button>
<button class="btn btn-outline">Outline</button>

<!-- Sizes -->
<button class="btn btn-xs">XS</button>
<button class="btn btn-sm">Small</button>
<button class="btn">Medium (default)</button>
<button class="btn btn-lg">Large</button>

<!-- States -->
<button class="btn" disabled>Disabled</button>
<button class="btn loading">Loading</button>
<button class="btn btn-wide">Full Width</button>
<button class="btn btn-block">Block (full width + center)</button>
```

### Cards

```html
<!-- Full card with header/body/actions -->
<div class="card card-factory bg-base-100 shadow-lg">
  <div class="card-body">
    <h2 class="card-title">Title</h2>
    <p>Description</p>
    <div class="card-actions justify-end">
      <button class="btn btn-primary">Action</button>
    </div>
  </div>
</div>

<!-- Compact card -->
<div class="card card-compact bg-base-100 shadow">
  <div class="card-body">
    <h3 class="card-title">Compact Title</h3>
    <p>Less padding</p>
  </div>
</div>
```

### Forms

```html
<!-- Form control with label -->
<label class="form-control w-full max-w-xs">
  <div class="label">
    <span class="label-text">Your Name</span>
    <span class="label-text-alt">Required</span>
  </div>
  <input
    type="text"
    placeholder="Type here"
    class="input input-bordered w-full"
  />
  <div class="label">
    <span class="label-text-alt">Validation message</span>
  </div>
</label>

<!-- Textarea -->
<textarea
  class="textarea textarea-bordered w-full"
  placeholder="Bio"
></textarea>

<!-- Select -->
<select class="select select-bordered w-full">
  <option disabled selected>Pick one</option>
  <option>Option 1</option>
  <option>Option 2</option>
</select>

<!-- Checkbox -->
<input type="checkbox" class="checkbox" />
<input type="checkbox" class="checkbox checkbox-primary" checked />

<!-- Radio -->
<input type="radio" name="radio-group" class="radio radio-primary" />
```

### Badges & Status

```html
<!-- Status indicators -->
<span class="badge badge-success">Success</span>
<span class="badge badge-warning">Warning</span>
<span class="badge badge-error">Error</span>
<span class="badge badge-info">Info</span>

<!-- Custom status classes (@layer components in styles.css) -->
<span class="status-active">Active</span>
<span class="status-pending">Pending</span>
<span class="status-error">Error</span>
```

### Layout & Spacing

```html
<!-- Flexbox -->
<div class="flex gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>Grid item</div>
  <div>Grid item</div>
  <div>Grid item</div>
</div>

<!-- Padding/Margin -->
<div class="p-4">Padding 1rem</div>
<div class="px-4 py-2">Horizontal & vertical padding</div>
<div class="m-4 mb-2">Margin with margin-bottom override</div>

<!-- Responsive -->
<div class="p-2 md:p-4 lg:p-8">
  Mobile: p-2 | Tablet (md): p-4 | Desktop (lg): p-8
</div>
```

### Progress & Loading

```html
<!-- Progress bar -->
<progress
  class="progress progress-primary w-full"
  value="65"
  max="100"
></progress>

<!-- Loading spinner -->
<span class="loading loading-spinner loading-sm"></span>
<span class="loading loading-spinner loading-md"></span>
<span class="loading loading-spinner loading-lg"></span>

<!-- Loading states on buttons -->
<button class="btn loading">Loading...</button>
```

---

## Theming

### Built-In Themes

30+ themes available. Apply to root HTML:

```html
<html data-theme="dark">
  <!-- Your app uses dark theme -->
</html>
```

**Popular themes**:

- `light` (default)
- `dark`
- `cupcake`, `bumblebee` (pastel)
- `emerald`, `forest`, `garden` (nature-inspired)
- `synthwave`, `cyberpunk`, `retro` (vintage)
- `luxury`, `dracula` (premium dark)

**Switch themes dynamically**:

```typescript
// In component
toggleTheme(): void {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
}
```

### Custom Colors

Extend Tailwind config in `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      'factory-primary': '#2563eb',
      'factory-success': '#10b981',
      'factory-warning': '#f59e0b',
      'factory-error': '#ef4444',
    },
  },
}
```

Use in templates:

```html
<div class="bg-factory-primary text-white p-4">Manufacturing Dashboard</div>
```

---

## Best Practices

### 1. Component Classes in @layer

Define reusable style combinations in `styles.css`:

```css
@layer components {
  .btn-factory {
    @apply btn btn-primary font-semibold transition-all shadow-md;
  }

  .card-factory {
    @apply card bg-base-100 shadow-lg border border-base-300 rounded-xl;
  }

  .input-factory {
    @apply input input-bordered focus:input-primary transition-colors;
  }
}
```

Then use everywhere:

```html
<button class="btn-factory">Save</button>
<div class="card-factory">Content</div>
<input class="input-factory" />
```

### 2. Mobile-First Responsive

Always design for mobile first, then enhance for larger screens:

```html
<!-- Mobile: p-2, Tablet: p-4, Desktop: p-8 -->
<div class="p-2 md:p-4 lg:p-8">Responsive padding</div>

<!-- Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>Item</div>
  <div>Item</div>
  <div>Item</div>
</div>
```

### 3. Type-Safe Component Props

Always define prop types as unions:

```typescript
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "accent"
  | "ghost"
  | "outline";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

@Component({})
export class ButtonComponent {
  variant = input<ButtonVariant>("primary");
  size = input<ButtonSize>("md");
}
```

### 4. Avoid Inline Styles

❌ **Bad**:

```html
<div style="padding: 1rem; color: blue; font-weight: bold;">Bad</div>
```

✅ **Good**:

```html
<div class="p-4 text-blue-500 font-bold">Good</div>
```

### 5. Use @layer Directives

Control specificity with Tailwind's @layer:

```css
@layer base {
  /* Lowest specificity — HTML defaults */
}

@layer components {
  /* Medium specificity — reusable component classes */
  .btn-factory {
    @apply btn btn-primary;
  }
}

@layer utilities {
  /* Highest specificity — one-off utilities */
}
```

### 6. Performance: ChangeDetectionStrategy.OnPush

✅ **Required** for all components:

```typescript
import { ChangeDetectionStrategy } from "@angular/core";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
export class MyComponent {}
```

Reduces unnecessary re-renders when using async subscriptions.

### 7. Performance: trackBy on Loops

Always use `track` on `@for` loops or `trackBy` on `*ngFor`:

❌ **Bad**:

```html
@for (item of items) {
<div>{{ item }}</div>
}
```

✅ **Good**:

```html
@for (item of items; track item.id) {
<div>{{ item }}</div>
}
```

### 8. Real-Time Updates with RxJS Buffering

High-frequency GraphQL subscriptions should buffer updates:

```typescript
// Buffer updates every 250ms to prevent excessive re-renders
buildProgress$ = this.buildService.progress$.pipe(
  bufferTime(250),
  filter((updates) => updates.length > 0),
  shareReplay(1),
);
```

---

## Common Patterns

### Build Status Card

```typescript
@Component({
  selector: "app-build-status",
  standalone: true,
  imports: [CardComponent, BadgeComponent, ButtonComponent],
  template: `
    <app-card [title]="buildName">
      <div class="mb-4">
        <app-badge [label]="status" [variant]="statusVariant()" />
      </div>

      <progress
        [value]="progress"
        max="100"
        class="progress progress-primary w-full"
      ></progress>

      <div class="mt-4 space-y-2">
        <p><strong>Duration:</strong> {{ duration }}s</p>
        <p><strong>Tests:</strong> {{ testsPassed }}/{{ testsTotal }}</p>
      </div>

      <div class="card-actions mt-6 gap-2">
        <app-button
          label="Details"
          variant="outline"
          (trigger)="viewDetails()"
        />
        <app-button label="Cancel" variant="ghost" (trigger)="cancelBuild()" />
      </div>
    </app-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuildStatusComponent {
  @Input() buildName = "Build #1";
  @Input() status = "In Progress";
  @Input() progress = 50;
  @Input() duration = 120;
  @Input() testsPassed = 100;
  @Input() testsTotal = 150;

  statusVariant = computed(() => {
    switch (this.status) {
      case "In Progress":
        return "info";
      case "Complete":
        return "success";
      case "Failed":
        return "error";
      default:
        return "warning";
    }
  });

  viewDetails(): void {
    /* ... */
  }
  cancelBuild(): void {
    /* ... */
  }
}
```

### Form with Validation

```typescript
@Component({
  selector: "app-build-form",
  standalone: true,
  imports: [FormComponent, ButtonComponent, FormModule],
  template: `
    <app-form [formGroup]="form" (onSubmit)="submit()">
      <label class="form-control w-full">
        <div class="label"><span class="label-text">Build Name</span></div>
        <input formControlName="name" class="input input-bordered w-full" />
        @if (form.get("name")?.hasError("required")) {
          <span class="label-text-alt text-error">Required</span>
        }
      </label>

      <label class="form-control w-full">
        <div class="label"><span class="label-text">Description</span></div>
        <textarea
          formControlName="description"
          class="textarea textarea-bordered w-full"
        ></textarea>
      </label>

      <div class="card-actions mt-4">
        <app-button label="Cancel" variant="ghost" (trigger)="cancel()" />
        <app-button label="Save" variant="primary" (trigger)="submit()" />
      </div>
    </app-form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuildFormComponent {
  form = this.fb.group({
    name: ["", Validators.required],
    description: [""],
  });

  constructor(private fb: FormBuilder) {}

  submit(): void {
    /* ... */
  }
  cancel(): void {
    /* ... */
  }
}
```

---

## Troubleshooting

### Styles Not Appearing

1. Verify `tailwind.config.ts` has `require('daisyui')` in plugins
2. Check `styles.css` is imported in `main.ts` or component
3. Rebuild: `pnpm --filter frontend run build`

### Theme Not Switching

Apply `data-theme` to root:

```html
<html data-theme="dark"></html>
```

Or set via JavaScript:

```typescript
document.documentElement.setAttribute("data-theme", "dark");
```

### Class Name Conflicts

Use unique component class names:

```css
@layer components {
  .btn-factory {
    @apply btn btn-primary;
  } /* ✅ Scoped */
  /* Not: .btn { @apply ... } ❌ Conflicts */
}
```

---

## Resources

- [daisyUI Docs](https://daisyui.com/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [daisyUI Component Gallery](https://daisyui.com/components/)
- [Tailwind Color Reference](https://tailwindcss.com/docs/customizing-colors)

---

## Related Documentation

- **Architecture**: docs/ARCHITECTURE.md
- **Frontend Status**: docs/FRONTEND-ARCHITECTURE-STATUS.md
- **Backend GraphQL**: docs/BACKEND-PATTERNS.md
- **daisyUI Developer Guide**: docs/daisyui-developer-guide.md (original reference)
