# daisyUI Developer Guide

**Updated**: May 30, 2026  
**Version**: 1.0  
**Status**: Active

---

## Overview

This guide covers the daisyUI + Tailwind CSS design system used in the ng-graphql-playground frontend. daisyUI provides semantic component classes built on Tailwind CSS, enabling fast component development without external design tools.

## Quick Start

### Using Pre-Built Components

Import and use any of the provided components:

```typescript
import { ButtonComponent } from "@app/components/button.component";
import { CardComponent } from "@app/components/card.component";

@Component({
  imports: [ButtonComponent, CardComponent],
  template: `
    <app-card title="Welcome">
      <p>This is a card with daisyUI styling</p>
      <app-button
        label="Click Me"
        variant="primary"
        (onClick)="handleClick()"
      />
    </app-card>
  `,
})
export class MyComponent {}
```

### Available Components

| Component         | Purpose                          | Variants                                                         | Example                                                                 |
| ----------------- | -------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `ButtonComponent` | Interactive buttons              | primary, secondary, accent, ghost, outline                       | `<app-button label="Save" variant="primary" size="md" />`               |
| `CardComponent`   | Container with shadow and border | N/A                                                              | `<app-card title="Title"><content/></app-card>`                         |
| `FormComponent`   | Reactive form wrapper            | N/A                                                              | `<app-form [formGroup]="form" (onSubmit)="submit()" />`                 |
| `ModalComponent`  | Dialog/confirmation              | N/A                                                              | `<app-modal title="Confirm" [isOpen]="true" (onConfirm)="confirm()" />` |
| `BadgeComponent`  | Status/label indicator           | success, warning, error, info, primary, secondary, accent, ghost | `<app-badge label="Active" variant="success" />`                        |

---

## Semantic CSS Classes

### Button Classes

daisyUI provides semantic button variants:

```html
<!-- Variants -->
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-accent">Accent</button>
<button class="btn btn-ghost">Ghost</button>
<button class="btn btn-outline">Outline</button>

<!-- Sizes -->
<button class="btn btn-xs">Extra Small</button>
<button class="btn btn-sm">Small</button>
<button class="btn">Medium (default)</button>
<button class="btn btn-lg">Large</button>

<!-- States -->
<button class="btn" disabled>Disabled</button>
<button class="btn loading">Loading</button>
<button class="btn btn-wide">Full Width</button>
```

### Card Classes

```html
<!-- Basic card -->
<div class="card card-factory bg-base-100 shadow-lg">
  <div class="card-body">
    <h2 class="card-title">Title</h2>
    <p>Description</p>
    <div class="card-actions">
      <button class="btn btn-primary">Action</button>
    </div>
  </div>
</div>

<!-- Compact card -->
<div class="card card-compact bg-base-100">
  <div class="card-body">Content</div>
</div>
```

### Form Classes

```html
<!-- Form control -->
<label class="form-control w-full max-w-xs">
  <div class="label">
    <span class="label-text">Your Name</span>
  </div>
  <input
    type="text"
    placeholder="Type here"
    class="input input-bordered w-full"
  />
  <div class="label">
    <span class="label-text-alt">Alt text</span>
  </div>
</label>

<!-- Textarea -->
<textarea class="textarea textarea-bordered" placeholder="Bio"></textarea>

<!-- Select -->
<select class="select select-bordered w-full">
  <option disabled selected>Pick one</option>
  <option>Option 1</option>
  <option>Option 2</option>
</select>

<!-- Checkbox -->
<input type="checkbox" class="checkbox" />

<!-- Radio -->
<input type="radio" name="radio-1" class="radio" />
```

### Status Badges

```html
<!-- Status badges (defined in styles.css @layer) -->
<span class="status-active">Active</span>
<span class="status-pending">Pending</span>
<span class="status-error">Error</span>
<span class="status-info">Info</span>

<!-- Generic badges -->
<span class="badge badge-success">Success</span>
<span class="badge badge-warning">Warning</span>
<span class="badge badge-error">Error</span>
<span class="badge badge-info">Info</span>
```

### Spacing & Layout

daisyUI builds on Tailwind's spacing system:

```html
<!-- Padding -->
<div class="p-4">Padding 1rem</div>
<div class="px-4 py-2">Horizontal and vertical</div>

<!-- Margin -->
<div class="m-4">Margin 1rem</div>
<div class="mb-2">Margin bottom 0.5rem</div>

<!-- Gap (flexbox/grid) -->
<div class="flex gap-4">Item 1 | Item 2 | Item 3</div>

<!-- Responsive -->
<div class="p-2 md:p-4 lg:p-8">Responsive padding</div>
```

---

## Theming

### Available Themes

daisyUI comes with 30+ built-in themes. Set the theme in your HTML:

```html
<html data-theme="dark">
  <!-- Uses dark theme -->
</html>
```

**Popular themes**:

- `light` (default)
- `dark`
- `cupcake`, `bumblebee` (pastel)
- `emerald`, `forest`, `garden` (nature)
- `synthwave`, `cyberpunk`, `retro` (vintage)
- `luxury`, `dracula` (dark variants)

### Custom Theme Colors

Extend the theme in `tailwind.config.ts`:

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

Use custom colors in components:

```html
<div class="bg-factory-primary text-white p-4">Manufacturing Dashboard</div>
```

---

## Real-World Example: Build Status Card

```typescript
import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardComponent } from "./card.component";
import { BadgeComponent } from "./badge.component";
import { ButtonComponent } from "./button.component";

@Component({
  selector: "app-build-status-card",
  standalone: true,
  imports: [CommonModule, CardComponent, BadgeComponent, ButtonComponent],
  template: `
    <app-card [title]="buildName">
      <!-- Status badge -->
      <div class="mb-4">
        <app-badge [label]="status" [variant]="statusVariant" />
      </div>

      <!-- Progress bar -->
      <progress
        [value]="progress"
        max="100"
        class="progress progress-primary w-full"
      ></progress>

      <!-- Build details -->
      <div class="mt-4 space-y-2">
        <p><strong>Duration:</strong> {{ duration }}s</p>
        <p><strong>Tests Passed:</strong> {{ testsPassed }}/{{ testsTotal }}</p>
      </div>

      <!-- Action buttons -->
      <div class="card-actions mt-6 gap-2">
        <app-button
          label="View Details"
          variant="outline"
          (onClick)="viewDetails()"
        />
        <app-button
          label="Cancel"
          variant="ghost"
          [disabled]="isComplete"
          (onClick)="cancelBuild()"
        />
      </div>
    </app-card>
  `,
})
export class BuildStatusCardComponent {
  @Input() buildName = "Build #42";
  @Input() status = "In Progress";
  @Input() progress = 65;
  @Input() duration = 120;
  @Input() testsPassed = 145;
  @Input() testsTotal = 150;

  get statusVariant(): any {
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
  }

  get isComplete(): boolean {
    return this.status === "Complete" || this.status === "Failed";
  }

  viewDetails(): void {
    console.log("View details for", this.buildName);
  }

  cancelBuild(): void {
    console.log("Cancel build", this.buildName);
  }
}
```

---

## Best Practices

### 1. Use Component Classes

Define reusable styles in `@layer components` in `styles.css`:

```css
@layer components {
  .btn-factory {
    @apply btn btn-primary font-semibold transition-all;
  }

  .card-factory {
    @apply card bg-base-100 shadow-lg border border-base-300;
  }
}
```

Then use them:

```html
<button class="btn-factory">Save</button>
<div class="card-factory">Content</div>
```

### 2. Avoid Inline Styles

**Don't do this**:

```html
<div style="padding: 1rem; color: blue; font-weight: bold;">Bad</div>
```

**Do this instead**:

```html
<div class="p-4 text-blue-500 font-bold">Good</div>
```

### 3. Responsive Design

Use Tailwind's responsive prefixes:

```html
<!-- Mobile-first approach -->
<div class="p-2 md:p-4 lg:p-8 xl:p-12">Responsive padding</div>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>Item</div>
  <div>Item</div>
  <div>Item</div>
</div>
```

### 4. Type-Safe Component Inputs

Always define explicit input types:

```typescript
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "accent"
  | "ghost"
  | "outline";

@Component({})
export class ButtonComponent {
  @Input() variant: ButtonVariant = "primary"; // Type-safe!
}
```

### 5. Combine with GraphQL Subscriptions

Example: Real-time build progress with Tailwind animations:

```typescript
@Component({
  template: `
    <div
      class="progress progress-primary"
      *ngIf="buildProgress$ | async as progress"
    >
      <progress [value]="progress.percentage" max="100"></progress>
    </div>

    <app-badge
      *ngIf="buildStatus$ | async as status"
      [label]="status.name"
      [variant]="status.variant"
    />
  `,
})
export class BuildProgressComponent {
  buildProgress$ = this.buildService.progress$.pipe(
    bufferTime(250), // Batch high-frequency updates
    shareReplay(1),
  );

  buildStatus$ = this.buildService.status$.pipe(shareReplay(1));

  constructor(private buildService: BuildService) {}
}
```

---

## Troubleshooting

### Styles Not Appearing

**Problem**: daisyUI classes not working (no visual effect)

**Solution**:

1. Verify `tailwind.config.ts` has `require('daisyui')` in plugins
2. Check that `styles.css` is imported in your component or main application
3. Rebuild with `npm run build`

### Theme Not Switching

**Problem**: `data-theme` attribute not working

**Solution**:

1. Apply to root HTML element: `<html data-theme="dark">`
2. Or use JavaScript: `document.documentElement.setAttribute('data-theme', 'dark')`
3. Verify theme name is valid (see theme list above)

### Class Name Conflicts

**Problem**: daisyUI class conflicts with custom CSS

**Solution**:

1. Use `@layer` directives to control specificity
2. Use unique component class names (e.g., `btn-factory` instead of just `btn`)
3. Order matters: define daisyUI overrides after base imports

---

## Resources

- [daisyUI Documentation](https://daisyui.com/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Component Gallery](https://daisyui.com/components/)
- [Tailwind CSS Interactive Reference](https://tailwindcss.com/docs/installation)

---

## Related Documentation

- `docs/agentic-workflow-for-ui-devel.md` — Terminal-first UI development workflow
- `.github/copilot/rules/copilot-cli-component-generation.md` — Copilot CLI skill for scaffolding
- GitHub Issues: [#30 (daisyUI), #9 (original design-to-code)](https://github.com/pluto-atom-4/ng-graphql-playground/issues)
