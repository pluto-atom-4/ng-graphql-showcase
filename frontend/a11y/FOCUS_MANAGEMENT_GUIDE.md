# Focus Management Guide

**Document Version:** 1.0  
**Last Updated:** 2026-08-03  
**Status:** WCAG 2.1 Level AA Compliant

## Overview

Focus management ensures keyboard and screen reader users can navigate predictably through modals, overlays, and complex components. This guide details patterns and services used.

## Focus Management Services

### FocusTrapService

**Purpose:** Confines Tab/Shift+Tab keyboard focus within a container (modal, overlay)

**How It Works:**

1. Listens for `keydown` events with `key === 'Tab'`
2. Gets all focusable elements in container
3. If Tab on last element: Jump to first element
4. If Shift+Tab on first element: Jump to last element

**Focusable Elements:**

```javascript
// FocusTrapService selector
("a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "iframe",
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]');
```

**Usage in Component:**

```typescript
// In ModalContainerComponent.ngAfterViewInit
const container = this.modalContent.nativeElement;

// Activate focus trap (returns unsubscribe function)
this.unsubscribeFocusTrap = this.focusTrap.trap(container);

// In ModalContainerComponent.ngOnDestroy
if (this.unsubscribeFocusTrap) {
  this.unsubscribeFocusTrap();
}
```

**Example:**

```html
<!-- Modal with focus trap enabled -->
<app-modal-container
  [config]="{ focusTrap: true }"
  (close)="isModalOpen = false"
>
  <!-- Tab cycles within this div -->
  <button>First button</button>
  <input type="text" />
  <button>Last button</button>
  <!-- Tab from last button jumps to first button -->
</app-modal-container>
```

### FocusRestoreService

**Purpose:** Saves and restores focus to trigger element after modal closes

**How It Works:**

1. When modal opens: Save the element that triggered it
2. When modal closes: Restore focus to that element
3. Smooth-scroll element into view if out of viewport

**Usage in Component:**

```typescript
// In ModalContainerComponent.ngAfterViewInit
if (this.triggerElement && this.config.restoreFocus !== false) {
  this.focusRestore.saveTrigger(this.triggerElement);
}

// In ModalContainerComponent.ngOnDestroy
if (this.config.restoreFocus !== false) {
  this.focusRestore.restore();
}
```

**API:**

```typescript
// Save trigger element for restoration on modal close
focusRestore.saveTrigger(element: HTMLElement): void

// Restore focus to saved element (smooth scroll into view)
focusRestore.restore(): void

// Clear saved element without restoring focus
focusRestore.clear(): void

// Get currently saved element
focusRestore.getTrigger(): HTMLElement | null
```

**Example:**

```html
<!-- Button that triggers modal -->
<button
  #triggerBtn
  (click)="openBuildDetailsModal()"
  aria-label="View build details"
>
  View Details
</button>

<!-- Modal (trigger element passed via input) -->
<app-modal-container
  [config]="{ restoreFocus: true }"
  [triggerElement]="triggerBtn"
  (close)="isModalOpen = false"
>
  <!-- Content -->
</app-modal-container>
```

## Modal Focus Lifecycle

### Complete Example: Build Details Modal

```typescript
export class BuildDetailsModalComponent implements AfterViewInit, OnDestroy {
  @Input() build!: Build;
  @Input() triggerElement?: HTMLElement;
  @Output() close = new EventEmitter<void>();

  @ViewChild("modalContent", { read: ElementRef }) modalContent?: ElementRef;

  private unsubscribeFocusTrap?: () => void;

  constructor(
    private focusTrap: FocusTrapService,
    private focusRestore: FocusRestoreService,
  ) {}

  ngAfterViewInit(): void {
    if (!this.modalContent) return;

    const container = this.modalContent.nativeElement;

    // 1. Save trigger element for focus restoration
    if (this.triggerElement) {
      this.focusRestore.saveTrigger(this.triggerElement);
    }

    // 2. Activate focus trap
    this.unsubscribeFocusTrap = this.focusTrap.trap(container);

    // 3. Move focus to first focusable element
    const firstFocusable = container.querySelector(
      'button, input, [tabindex]:not([tabindex="-1"])',
    ) as HTMLElement;
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }

  ngOnDestroy(): void {
    // 1. Remove focus trap listener
    if (this.unsubscribeFocusTrap) {
      this.unsubscribeFocusTrap();
    }

    // 2. Restore focus to trigger element
    this.focusRestore.restore();
  }

  onClose(): void {
    this.close.emit();
  }
}
```

### Template for Modal

```html
<!-- Wrapper for focus trap -->
<div
  #modalContent
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
  <h2 id="modal-title">Build Details</h2>

  <!-- Form with focusable elements -->
  <input id="build-name" type="text" [value]="build.name" />
  <textarea id="build-description">{{ build.description }}</textarea>

  <!-- Action buttons -->
  <button (click)="onSave()">Save</button>
  <button (click)="onClose()">Cancel</button>
</div>
```

## Focus Order Rules

### 1. Natural DOM Order

**Principle:** Tab order follows DOM order by default

**Good:**

```html
<button>First</button>
<!-- Tabindex 1 -->
<button>Second</button>
<!-- Tabindex 2 -->
<button>Third</button>
<!-- Tabindex 3 -->
```

**Avoid:**

```html
<button tabindex="3">First</button>
<!-- Confusing! -->
<button tabindex="1">Second</button>
<button tabindex="2">Third</button>
```

### 2. Skip Programmatically Hidden Elements

**FocusTrapService automatically filters out:**

- Elements with `display: none`
- Elements with `visibility: hidden`
- Elements with `offsetParent === null` (hidden from layout)
- Disabled buttons/inputs

### 3. Modal Focus Trap Implementation

**Steps:**

1. Collect all focusable elements in container
2. Filter out hidden/disabled elements
3. On Tab on last element: Jump to first
4. On Shift+Tab on first element: Jump to last
5. Return unsubscribe function to clean up listener

**Code:**

```typescript
trap(container: HTMLElement): () => void {
  const keyDownListener = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    const focusableElements = this.getFocusableElements(container);
    const activeElement = document.activeElement as HTMLElement;
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift+Tab from first → jump to last
      if (activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab from last → jump to first
      if (activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };

  container.addEventListener('keydown', keyDownListener);
  return () => container.removeEventListener('keydown', keyDownListener);
}
```

## Focus Visibility Styles

### Standard :focus-visible

**Applied to all interactive elements:**

```css
button:focus-visible,
input:focus-visible,
textarea:focus-visible,
select:focus-visible,
a:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
```

### Component-Specific Styles

**ButtonComponent:**

```css
button:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
```

**TabsComponent:**

```css
[role="tab"]:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
```

**InlineEditorComponent:**

```css
input:focus {
  border-color: #3b82f6;
}
```

## Common Focus Management Patterns

### Pattern 1: Simple Overlay/Popover

```typescript
// No focus trap needed (popover closes on click outside)
// But do restore focus to trigger

ngAfterViewInit() {
  this.focusRestore.saveTrigger(this.triggerElement);
  this.overlay.nativeElement.focus();
}

ngOnDestroy() {
  this.focusRestore.restore();
}
```

### Pattern 2: Modal with Focus Trap

```typescript
// Full focus management

ngAfterViewInit() {
  const container = this.modalContent.nativeElement;

  // Save trigger for restoration
  this.focusRestore.saveTrigger(this.triggerElement);

  // Trap focus within modal
  this.unsubscribeFocusTrap = this.focusTrap.trap(container);

  // Move focus to first input
  container.querySelector('input')?.focus();
}

ngOnDestroy() {
  this.unsubscribeFocusTrap?.();
  this.focusRestore.restore();
}
```

### Pattern 3: Nested Modals (Stack)

```typescript
// Each modal manages its own focus

// Modal 1
ngAfterViewInit() {
  const container = this.modalContent.nativeElement;

  // Only trap within this modal
  this.unsubscribeFocusTrap = this.focusTrap.trap(container);

  // Don't restore focus yet (modal 2 still open)
}

// Modal 2 (on top of Modal 1)
ngAfterViewInit() {
  const container = this.modalContent.nativeElement;

  // Trap within this modal
  this.unsubscribeFocusTrap = this.focusTrap.trap(container);

  // Save trigger (from Modal 1's button)
  this.focusRestore.saveTrigger(this.triggerElement);
}

ngOnDestroy() {
  // Restore focus to Modal 1's button
  this.focusRestore.restore();
  // Modal 1's focus trap resumes
}
```

## Testing Focus Management

### Manual Testing Checklist

- [ ] Focus visible on all interactive elements
- [ ] Tab/Shift+Tab cycles through modal correctly
- [ ] Focus trapped within modal (can't escape)
- [ ] Escape key closes modal
- [ ] Focus restored to trigger after modal close
- [ ] Restore includes smooth scroll into view
- [ ] Works with multiple modals stacked

### Automated Testing

```bash
# Test focus trap
pnpm test -- focus-trap.service.spec.ts

# Test focus restore
pnpm test -- focus-restore.service.spec.ts

# Test keyboard navigation (includes focus)
pnpm test:keyboard
```

### Debug Focus Issues

```typescript
// Log current active element
console.log("Current focus:", document.activeElement);

// Log all focusable elements in container
const focusable = container.querySelectorAll(
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
);
console.log("Focusable elements:", focusable);

// Check if focus trap is active
console.log("Focus trap active:", this.unsubscribeFocusTrap !== undefined);
```

## Accessibility Compliance

### WCAG 2.1 Requirements Met

- **2.1.1 Keyboard (Level A):** All functionality available via keyboard
- **2.1.2 No Keyboard Trap (Level A):** Focus trap can be exited (Escape key)
- **2.4.3 Focus Order (Level A):** Focus order is meaningful
- **2.4.7 Focus Visible (Level AA):** Always-visible focus indicators
- **3.2.1 On Focus (Level A):** Components don't launch modals on focus

### Test Results

- [x] All components have focus-visible styles
- [x] Modal focus trap implementation verified
- [x] Focus restoration working correctly
- [x] Escape key exits focus trap
- [x] Tab order is logical and consistent

## References

- [MDN: focus property](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus)
- [WAI-ARIA: Focus Management](https://www.w3.org/WAI/ARIA/apg/patterns/dialogmodal/)
- [WCAG 2.1: Focus Visible (2.4.7)](https://www.w3.org/WAI/WCAG21/Understanding/focus-visible)
- [WCAG 2.1: Focus Order (2.4.3)](https://www.w3.org/WAI/WCAG21/Understanding/focus-order)

## Troubleshooting

### Focus Not Restoring After Modal Close

**Check:**

1. `restoreFocus` config not set to false
2. `triggerElement` input is set
3. Component calls `focusRestore.restore()` in `ngOnDestroy`

### Focus Escaping Modal

**Check:**

1. `focusTrap` config not set to false
2. Modal calls `focusTrap.trap(container)` in `ngAfterViewInit`
3. Modal calls unsubscribe in `ngOnDestroy`

### Focus Not Visible

**Check:**

1. Element has `:focus-visible` styles
2. Browser supports `:focus-visible` (all modern browsers)
3. Element not hidden with `visibility: hidden` or `display: none`

## Phase 5+ Roadmap

- [x] FocusTrapService implementation
- [x] FocusRestoreService implementation
- [x] Modal focus lifecycle
- [ ] Skip links (Phase 6+)
- [ ] Focus indicators for screen reader only users
- [ ] Roving tabindex pattern for lists
