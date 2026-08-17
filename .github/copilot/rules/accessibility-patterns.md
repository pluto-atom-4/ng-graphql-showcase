---
applies_to:
  - "frontend/src/**/*.ts"
  - "frontend/src/**/*.html"
autoload: onEdit
priority: medium
---

# Accessibility Patterns (WCAG 2.1 Level AA)

**Reference**: [.claude/rules/accessibility-patterns.md](../../.claude/rules/accessibility-patterns.md)

## Quick Rules

| Rule               | Enforcement                                                                       |
| ------------------ | --------------------------------------------------------------------------------- |
| **Keyboard Nav**   | Tab order logical + sequential. Arrow keys in tabs/lists. Escape closes modals.   |
| **ARIA**           | Use roles (`main`, `navigation`, `tab`, `status`, `alert`), labels, live regions. |
| **Focus**          | Focus trap in modals. Focus management on close. Focus visible (no removal).      |
| **Color Contrast** | 4.5:1 minimum (normal text). 3:1 (large text). Check with WAVE/axe.               |
| **Touch Targets**  | 44×44px minimum (all interactive elements).                                       |

## Keyboard Navigation

- **Tab**: Logical sequential progression through all interactive elements
- **Arrow Keys**: ←/→/↑/↓ navigate within tabs/lists. Home/End jump to ends.
- **Enter/Space**: Activate buttons, form controls, toggle checkboxes
- **Escape**: Close modals, dialogs, dropdown menus
- **No keyboard traps**: Users can always move focus away

## ARIA Essentials

```html
<!-- Landmark regions -->
<main role="main" id="main"></main>
<nav role="navigation" aria-label="Main"></nav>

<!-- Tabs -->
<div role="tablist">
  <button role="tab" aria-selected="true" aria-controls="panel1">Tab 1</button>
</div>
<div role="tabpanel" id="panel1" aria-labelledby="tab1"></div>

<!-- Form labels -->
<label for="name">Name:</label>
<input id="name" aria-label="Full name" aria-invalid="false" />

<!-- Live regions (real-time updates) -->
<div role="status" aria-live="polite" aria-atomic="true">
  Saved successfully
</div>
```

## Component Checklist

- **ButtonComponent**: Semantic `<button>`, `aria-label`, `aria-busy` when loading
- **FormInputs**: `<label for>` + `aria-describedby`, `aria-invalid`, `aria-required`
- **TabsComponent**: `role="tablist"`, `role="tab"` with `aria-selected`/`aria-controls`
- **Modals**: `role="dialog"`, `aria-modal="true"`, focus trap, restore on close

## Testing

```bash
pnpm --filter frontend run test:a11y      # Automated a11y tests (65+ checks)
pnpm --filter frontend run audit:lighthouse # Lighthouse accessibility audit
```

Manual: See `frontend/a11y/TESTING_CHECKLIST.md` for detailed keyboard + screen reader testing.
