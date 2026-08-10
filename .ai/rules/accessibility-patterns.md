# Accessibility Patterns (Phase 4)

**WCAG 2.1 Level AA Compliance** | **65+ automated tests** | **Manual testing guide**

## Keyboard Navigation (40+ tests)

- Tab order: Logical, sequential progression through all interactive elements
- Arrow keys: Navigate within tabs (→/↓ next, ←/↑ previous, Home first, End last)
- Enter/Space: Activate buttons and form controls
- Escape: Close modals, dialogs, dropdown menus
- Focus management: Trap focus in modals, restore on close

**Utility:** `frontend/src/app/dashboard/a11y/keyboard-navigation.utils.ts`  
**Tests:** `frontend/src/app/dashboard/__tests__/keyboard-navigation.spec.ts`

## ARIA Compliance (23+ tests)

- Roles: `main`, `navigation`, `tablist`, `tab`, `tabpanel`, `status`, `alert`, `dialog`
- Attributes: `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-selected`, `aria-controls`, `aria-live`, `aria-atomic`, `aria-modal`, `aria-busy`, `aria-invalid`, `aria-required`
- Live regions: Announce real-time updates (status/error messages)
- Form labels: Associated via `<label for>` or `aria-label`

**Tests:** `frontend/src/app/dashboard/__tests__/aria-compliance.spec.ts`

## Landmark Regions

- `<main role="main">` with id="main"
- `<nav role="navigation">` with aria-label
- `<footer role="contentinfo">`
- `<aside role="complementary">` with aria-label
- Skip-to-main link as first focusable element

## Component Accessibility

**TabsComponent**: `role="tablist"`, `role="tab"` with `aria-selected`/`aria-controls`, `role="tabpanel"` with `aria-labelledby`; arrow keys + Home/End nav.

**ButtonComponent**: Semantic `<button>`, `aria-label`, `aria-busy="true"` when loading, `aria-disabled` matched to state.

**Form Inputs**: Each `<input>` requires `<label for>` or `aria-label`, plus `aria-describedby`, `aria-required`, `aria-invalid` as needed.

**Live Regions**: `role="status" aria-live="polite"` for updates, `role="alert" aria-live="assertive"` for errors.

**Testing** (`npm run test:a11y`, `test:keyboard`; `audit:lighthouse`, `audit:pa11y`; manual: `frontend/a11y/TESTING_CHECKLIST.md`)

## Compliance Status

✓ Keyboard nav 100% (42 tests) | ARIA 100% (23 tests) | Focus 100% | 4.5:1 contrast | 44x44px touch targets | See `frontend/a11y/A11Y_REPORT.md`
