# daisyUI + Copilot CLI: Terminal Workflow Guide

**Updated**: May 30, 2026  
**Status**: Active  
**Purpose**: Solo developer workflow for rapid UI component development using terminal-first approach

---

## Overview

This guide describes the terminal-first development workflow for building Angular components with daisyUI and GitHub Copilot CLI, optimized for fast iteration without visual design tools.

**The Workflow**:

```
Terminal → Copilot CLI → Generate Scaffold → Add daisyUI Classes → Wire GraphQL → Test
```

---

## Setup

### Prerequisites

- Node.js 18+
- pnpm (monorepo package manager)
- GitHub Copilot CLI installed: `npm install -g @github/gh-copilot`
- JetBrains Rider (optional but recommended)

### Verify Installation

```bash
# Check Copilot CLI is installed
gh copilot --version

# Check Tailwind + daisyUI
cd frontend && npm ls tailwindcss daisyui

# Verify styles compile
npm run build

# Start dev server
npm run dev
```

---

## Typical Workflow: Building a New Component

### Step 1: Sketch Component Intent (Copilot CLI)

```bash
# Ask Copilot to suggest a component scaffold
gh copilot -- -i "I need a component to display a manufacturing workflow state: In Progress, Complete, Failed, Cancelled. Use daisyUI badge classes for the state, a progress bar, and two action buttons (View Details, Cancel). I want this as a standalone Angular component with type-safe inputs."
```

**Copilot Output** (example):

```
I'll create a WorkflowStateComponent with:
- daisyUI badge for status
- Progress bar with semantic classes
- Two buttons (View Details, Cancel)
- Type-safe @Input properties

Here's the TypeScript template:

@Component({
  selector: 'app-workflow-state',
  template: `
    <div class="card card-factory">
      <div class="card-body">
        <app-badge [label]="state" [variant]="stateVariant" />
        <progress class="progress" [value]="progress" max="100"></progress>
        <div class="flex gap-2">
          <button class="btn btn-outline">View Details</button>
          <button class="btn btn-ghost">Cancel</button>
        </div>
      </div>
    </div>
  `
})
```

### Step 2: Create Component File

```bash
# Create component from Copilot's template
cat > frontend/src/app/components/workflow-state.component.ts << 'EOF'
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent, BadgeComponent, ButtonComponent } from './index';

@Component({
  selector: 'app-workflow-state',
  standalone: true,
  imports: [CommonModule, CardComponent, BadgeComponent, ButtonComponent],
  template: `
    <app-card title="Workflow Status">
      <div class="flex items-center gap-2 mb-4">
        <app-badge [label]="state" [variant]="stateVariant" />
        <span class="text-sm text-gray-500">{{ percentage }}% Complete</span>
      </div>
      <progress class="progress progress-primary w-full" [value]="percentage" max="100"></progress>
      <div class="card-actions mt-4">
        <app-button label="View Details" variant="outline" (onClick)="onViewDetails()" />
        <app-button label="Cancel" variant="ghost" [disabled]="isComplete" (onClick)="onCancel()" />
      </div>
    </app-card>
  `
})
export class WorkflowStateComponent {
  @Input() state: 'In Progress' | 'Complete' | 'Failed' | 'Cancelled' = 'In Progress';
  @Input() percentage = 0;
  @Output() onViewDetails = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  get stateVariant(): 'info' | 'success' | 'error' | 'warning' {
    switch (this.state) {
      case 'Complete': return 'success';
      case 'Failed': return 'error';
      case 'Cancelled': return 'warning';
      default: return 'info';
    }
  }

  get isComplete(): boolean {
    return this.state === 'Complete' || this.state === 'Failed';
  }
}
EOF
```

### Step 3: Add to Component Index

```bash
# Update component exports
echo "export { WorkflowStateComponent } from './workflow-state.component';" >> frontend/src/app/components/index.ts
```

### Step 4: Wire to GraphQL (Copilot CLI)

```bash
# Ask Copilot to suggest GraphQL integration
gh copilot -- -i "Wire the WorkflowStateComponent to a GraphQL subscription called workflowUpdates that returns state and percentage. The subscription should run every 250ms and the component should buffer updates using RxJS bufferTime(250)."
```

### Step 5: Test in Dev Server

```bash
# Start the dev server
npm run dev

# In another terminal, navigate to your component page and verify:
# - Badge changes color based on state
# - Progress bar animates
# - Buttons are clickable
# - No TypeScript errors
```

### Step 6: Commit

```bash
# Stage files
git add frontend/src/app/components/workflow-state.component.ts
git add frontend/src/app/components/index.ts

# Pre-commit hooks will format and lint automatically
git commit -m "feat(ui): Add WorkflowStateComponent with daisyUI"

# Push to feature branch
git push origin feat/workflow-state
```

---

## System Prompts for Consistent Component Generation

Use these prompts with Copilot CLI to maintain consistency across components.

### Prompt: daisyUI Component Scaffold

```
I need a [Component Name] component that [use case].

Requirements:
1. Use daisyUI semantic classes: card, btn, badge, progress, modal, etc.
2. Use only inline templates (no separate .html files)
3. Import from '@app/components/index' for shared components
4. Define explicit type-safe inputs (@Input properties with types)
5. Use Angular Signals for state (if needed)
6. Implement OnInit/OnDestroy for lifecycle management
7. Use RxJS operators: map, filter, shareReplay, bufferTime for subscriptions
8. Handle GraphQL subscriptions with bufferTime(250) for high-frequency updates
9. Add JSDoc comments explaining the component and GraphQL mapping
10. Export all types used (e.g., type Status = 'Active' | 'Inactive')

Template style:
@Component({
  selector: 'app-[component-name]',
  standalone: true,
  imports: [CommonModule, ...],
  template: `...`
})
export class [ComponentName]Component {
  ...
}
```

### Prompt: GraphQL Wire-Up

```
Add RxJS subscription to this component:
- Subscribe to GraphQL subscription: [subscription name]
- Buffer updates every 250ms using bufferTime(250)
- Map subscription response to component inputs
- Handle errors gracefully
- Unsubscribe on component destroy using takeUntil(destroy$)
- Use shareReplay(1) for multicasting

Provide:
1. Observable setup in ngOnInit()
2. Async pipe usage in template
3. Unsubscribe cleanup in ngOnDestroy()
```

### Prompt: Component Documentation

```
Generate documentation for [Component Name]:
1. Summary (one sentence)
2. Inputs table (property name, type, description, default)
3. Outputs table (event name, emitted value type)
4. Usage example (template snippet)
5. Related components
6. daisyUI classes used
```

---

## Common Development Tasks

### Adding a New daisyUI Color Variant

1. **Define in Tailwind config**:

```typescript
// frontend/tailwind.config.ts
theme: {
  extend: {
    colors: {
      'factory-secondary': '#8b5cf6',
    },
  },
}
```

2. **Use in component**:

```html
<div class="bg-factory-secondary text-white p-4">Content</div>
```

### Creating a Reusable Component Variant

**Example**: Different button sizes

```typescript
// In button.component.ts
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

@Input() size: ButtonSize = 'md';

getClasses(): string {
  const sizeClass = this.size === 'md' ? '' : `btn-${this.size}`;
  return ['btn', `btn-${this.variant}`, sizeClass].filter(Boolean).join(' ');
}
```

**Usage**:

```html
<app-button label="Small" size="sm" /> <app-button label="Large" size="lg" />
```

### Real-Time Data Visualization

```typescript
// Component with high-frequency updates
@Component({
  template: `
    <div class="chart">
      <app-metric-card
        label="Tests Passed"
        [value]="(metrics$ | async)?.testsPassed"
        [total]="(metrics$ | async)?.total"
      />
    </div>
  `,
})
export class MetricsComponent implements OnInit {
  metrics$ = this.buildService.metrics$.pipe(
    bufferTime(250), // Batch updates
    map((updates) => updates[updates.length - 1]),
    shareReplay(1),
  );
}
```

### Responsive Layout

```html
<!-- Mobile first, then tablets, then desktop -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <app-card *ngFor="let item of items">{{ item.name }}</app-card>
</div>
```

---

## Debugging Tips

### Component Not Rendering?

```bash
# 1. Check TypeScript compilation
npm run build

# 2. Verify styles are applied
npm run dev
# Open DevTools (F12) → Elements → Check computed styles

# 3. Check console for errors
# Should see: "app-button rendered" (if logging enabled)

# 4. Verify component is imported/exported
grep "export" frontend/src/app/components/index.ts
```

### daisyUI Classes Not Working?

```bash
# 1. Verify Tailwind is processing the file
grep "daisyui" frontend/tailwind.config.ts

# 2. Check styles.css is linked
grep "import.*styles.css" frontend/src/main.ts

# 3. Rebuild Tailwind
npm run build -- --reset
```

### GraphQL Subscription Not Updating?

```bash
# 1. Check subscription is running
# Open DevTools → Network → WebSocket
# Should see live subscription messages

# 2. Verify bufferTime interval matches update frequency
# If updates are <250ms, they'll be batched

# 3. Check for memory leaks
# Verify takeUntil(destroy$) is used
```

---

## Performance Checklist

- [ ] All subscriptions use `takeUntil(destroy$)` to prevent memory leaks
- [ ] High-frequency updates use `bufferTime(250)` to prevent UI thrashing
- [ ] Components use `OnPush` change detection (default with standalone)
- [ ] `*ngFor` loops have explicit `trackBy` functions
- [ ] Async pipes are used in templates (not manual subscriptions)
- [ ] No `setTimeout`/`setInterval` without cleanup
- [ ] Tailwind purges unused classes in production build

---

## Terminal Commands Cheat Sheet

```bash
# Development
npm run dev                    # Start backend + frontend watchers
npm run ng serve              # Frontend only
npm run build                 # Build for production
npm run test                  # Run all tests

# Component Development
npm run codegen              # Regenerate GraphQL types
npm run lint                 # Lint frontend code
npm run format               # Format with Prettier

# Debugging
npm run ng -- --verbose      # Angular CLI verbose output
npm run build -- --stats     # Build size analysis
npm run test -- --browsers=Chrome --watch  # Watch tests

# Git Workflow
git branch feat/[component-name]
git checkout feat/[component-name]
git add frontend/src/app/components/[component-name].component.ts
git commit -m "feat(ui): Add [ComponentName]"
git push origin feat/[component-name]
```

---

## Next Steps

After completing Phase 4, you're ready to:

1. **Scale component library**: Create 20+ daisyUI-based components
2. **Build design system documentation**: Screenshot gallery with all variants
3. **Integrate Playwright**: Add visual regression tests for all components
4. **Create Figma mirror**: Use Figma only for documentation, not code generation
5. **Team onboarding**: Share this guide with new developers

---

## Related Documentation

- `docs/daisyui-developer-guide.md` — Complete daisyUI reference
- `docs/agentic-workflow-for-ui-devel.md` — Original design philosophy
- `blog-why-daisyui-over-figma-builder-io.md` — Architectural decision rationale
