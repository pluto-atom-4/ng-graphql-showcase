# Why We Chose daisyUI Over Figma/Builder.io

**Posted**: May 28, 2026

---

## TL;DR

We implemented Figma/Builder.io design-to-code automation, merged it, then reverted it. The tooling worked fine, but it added too much complexity for a solo developer workflow. daisyUI + Playwright does the job with less overhead.

## The Decision

As a solo developer managing the full stack (frontend, backend, database), visual design tools introduced operational burden that didn't justify the benefit.

---

## The Trade-offs

### Figma/Builder.io Approach

**What we got** ✅

- Auto-generated Angular components from visual designs
- Visual designer feedback loop (even if just us iterating)
- Professional design tool ecosystem
- ~70% less CSS boilerplate

**What it cost** ❌

- **2 external tools to manage**: Figma + Builder.io accounts, credentials, GitHub Secrets
- **3,400+ lines added to pnpm-lock.yaml**: More dependencies to track
- **Additional CI/CD complexity**: Schema exports, code generation pipelines, sync workflows
- **Unclear code ownership**: Is Figma the truth, or the generated code?
- **Context switching overhead**: Switch between Figma, Builder.io, IDE, Terminal
- **Maintenance burden**: API changes from either vendor require migration
- **Mental load**: One more tool to keep in your head while coding

### daisyUI Approach

**What we get** ✅

- Zero external tools—just plain TypeScript and semantic CSS
- Tailwind already installed—daisyUI is just a plugin
- Single source of truth: the component code itself
- Developers can rapidly iterate without tool context
- Full control over styling without vendor dependencies
- Minimal pnpm-lock.yaml impact
- Familiar, standard web vocabulary

**What we give up** ❌

- No visual design tool (but Playwright replaces that for UAT)
- Developers own the styling (not necessarily a con)
- No drag-and-drop UI builder

---

## Workflow Comparison

**Old flow**:

```
Idea → Figma → Design → Builder.io → Generate Code → IDE → Wire to GraphQL → Test
```

**New flow**:

```
Idea → IDE (TypeScript + daisyUI classes) → Wire to GraphQL → Test
```

Fewer context switches. Faster iteration.

## Visual Testing with Playwright

Use automated visual regression testing instead of a design tool.

### Example: BuildProgressCard

Instead of designing in Figma, you:

1. **Code the component** in Angular (1 min):

```typescript
@Component({
  selector: "app-build-progress-card",
  template: `
    <div class="card bg-base-100 shadow-md">
      <div class="card-body">
        <h2 class="card-title">{{ build.name }}</h2>
        <progress
          class="progress progress-primary"
          [value]="progress"
        ></progress>
        <div class="card-actions">
          <button class="btn btn-sm">Details</button>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class BuildProgressCardComponent {
  @Input() build!: Build;
  @Input() progress = 0;
}
```

2. **Write a Playwright visual test** (2 min):

```typescript
test("BuildProgressCard renders with correct layout", async ({ page }) => {
  await page.goto("/components/build-progress-card");
  await expect(page.locator("app-build-progress-card")).toHaveScreenshot();
});

test("BuildProgressCard shows complete state", async ({ page }) => {
  await page.goto("/components/build-progress-card?progress=100");
  await expect(page.locator("app-build-progress-card")).toHaveScreenshot();
});
```

3. **Run the test** (10 seconds):

```bash
npm run test:e2e -- --update-snapshots
```

4. **Review the visual snapshot** in Playwright Inspector (30 seconds)

5. **Commit the snapshot** as your design system truth

**Result**: You have a visual design system, automated tests, and full control—no external tools.

---

## daisyUI IS the Design System

You don't need Figma to define a design system. daisyUI provides one:

### Color System

```html
<!-- Semantic colors, not arbitrary -->
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<div class="alert alert-error">{{ errorMessage }}</div>
```

### Spacing System

```html
<!-- Consistent rhythm -->
<div class="p-4 m-2 gap-3">
  <card />
  <card />
</div>
```

### Typography System

```html
<!-- Predefined scales -->
<h1 class="text-4xl font-bold">Heading</h1>
<p class="text-base">Body text</p>
<span class="text-sm text-gray-500">Caption</span>
```

### Component Variants

```html
<!-- Button states, sizes, styles -->
<button class="btn btn-lg btn-outline btn-primary">Large Outlined</button>
<button class="btn btn-sm btn-ghost">Small Ghost</button>
<button class="btn btn-block">Full Width</button>
```

**You can't accidentally use `p-3.7` or invent new colors.** The design system is enforced by Tailwind's class vocabulary.

---

## The Real Cost: Vendor Lock-In

One factor we underestimated: **vendor dependency**.

If Builder.io:

- Changes pricing
- Deprecates the CLI
- Changes API authentication
- Discontinues code generation features

...you're stuck. Your CI/CD pipeline breaks. Your design-to-code workflow collapses.

With daisyUI + Tailwind, you own the vocabulary. Tailwind is open-source. daisyUI is MIT-licensed. No vendor can break your workflow.

**Independence is worth paying for in simplicity.**

---

## Headless Development + Playwright UAT

The real power isn't visual design tools—it's **automated testing**.

### Development Phase (Headless)

```bash
npm run dev
# No browser needed. Terminal output tells you everything.
# - API status
# - GraphQL schema changes
# - Type errors
# - Test failures
```

### UAT Phase (Playwright)

```bash
npm run test:e2e -- --headed
# Full visual inspection in Playwright Inspector
# - Screenshots on every route
# - Visual regression detection
# - User interaction simulation
# - Performance metrics
```

This is where you catch UX issues—not in a design tool, but in actual user flows.

---

## The Numbers

### Time Investment

| Task                          | Figma/Builder.io   | daisyUI              |
| ----------------------------- | ------------------ | -------------------- |
| Design component              | 10 min             | 1 min                |
| Iterate styling               | 5 min (regenerate) | 30 sec (class tweak) |
| Test visual output            | 2 min (Builder.io) | 10 sec (Playwright)  |
| Fix a regression              | 8 min (re-design)  | 1 min (class change) |
| **Total for iteration cycle** | ~25 min            | ~3 min               |

## Dependency Cost

| Metric                | Figma/Builder.io                | daisyUI             |
| --------------------- | ------------------------------- | ------------------- |
| External tools        | 2                               | 0                   |
| New npm packages      | 2                               | 0                   |
| pnpm-lock.yaml impact | +3,400 lines                    | 0 lines             |
| GitHub Secrets        | 4                               | 0                   |
| CI/CD pipelines       | Code generation + schema export | Just npm test/build |

## What This Means Operationally

- **Less cognitive load**: One fewer tool to track
- **Faster iteration**: No design tool context switching
- **No vendor risk**: Tailwind and daisyUI are stable, open-source
- **Smaller lock file**: 3,400 fewer lines to maintain
- **Simpler CI/CD**: No code generation pipelines to debug
- **Type-safe by default**: Components are TypeScript, tested immediately

## The Approach

- Use daisyUI for semantic, maintainable components
- Use Tailwind for consistent spacing, color, typography
- Use Playwright for visual regression testing and UAT
- Keep components type-safe with Angular Signals and strict TypeScript
- Add code comments for design rationale when needed

## Summary

Figma/Builder.io works, but adds operational overhead:

- 2 external tools to manage
- 4 GitHub Secrets to rotate
- 3,400+ lines in lock file
- Code generation pipelines to maintain

For a solo developer, daisyUI + Tailwind + Playwright achieves the same result with less complexity:

- No external tools
- No credentials
- Standard, familiar class vocabulary
- Automatic visual regression testing for UAT

Use what you need. Skip what you don't.

**References**:

- [daisyUI Components](https://daisyui.com/components/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots)
- GitHub Issues: [#9 (revert), #30 (daisyUI)](https://github.com/pluto-atom-4/ng-graphql-ng-graphql-showcase/issues)
