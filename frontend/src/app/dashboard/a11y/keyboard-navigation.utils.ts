/**
 * Keyboard Navigation Testing Utilities
 * Phase 4b - Accessibility testing helpers
 */

/**
 * Dispatch a keyboard event on an element
 */
export function dispatchKeyboardEvent(
  element: HTMLElement,
  eventType: 'keydown' | 'keyup' | 'keypress',
  key: string,
  options: Partial<KeyboardEventInit> = {}
): KeyboardEvent {
  const event = new KeyboardEvent(eventType, {
    key,
    code: getKeyCode(key),
    bubbles: true,
    cancelable: true,
    ...options,
  });
  element.dispatchEvent(event);
  return event;
}

/**
 * Get the code for a given key
 */
export function getKeyCode(key: string): string {
  const keyMap: Record<string, string> = {
    'Enter': 'Enter',
    ' ': 'Space',
    'ArrowUp': 'ArrowUp',
    'ArrowDown': 'ArrowDown',
    'ArrowLeft': 'ArrowLeft',
    'ArrowRight': 'ArrowRight',
    'Home': 'Home',
    'End': 'End',
    'Escape': 'Escape',
    'Tab': 'Tab',
  };
  return keyMap[key] || key;
}

/**
 * Get all focusable elements in a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];

  return Array.from(container.querySelectorAll(focusableSelectors.join(',')));
}

/**
 * Check if an element is visible
 */
export function isVisible(element: HTMLElement): boolean {
  return element.offsetWidth > 0 && element.offsetHeight > 0;
}

/**
 * Check if an element has focus-visible styling
 */
export function hasFocusVisible(element: HTMLElement): boolean {
  return element.matches(':focus-visible') || element.classList.contains('focus-visible');
}

/**
 * Get the tab order of focusable elements
 */
export function getTabOrder(container: HTMLElement): HTMLElement[] {
  const focusable = getFocusableElements(container);
  return focusable
    .filter(isVisible)
    .sort((a, b) => {
      const aTabIndex = parseInt(a.getAttribute('tabindex') || '0', 10);
      const bTabIndex = parseInt(b.getAttribute('tabindex') || '0', 10);

      if (aTabIndex !== bTabIndex) {
        return aTabIndex - bTabIndex;
      }

      return a.compareDocumentPosition(b) === Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
}

/**
 * Simulate tabbing through elements
 */
export function tabThroughElements(
  container: HTMLElement,
  count: number = 1,
  reverse: boolean = false
): HTMLElement[] {
  const order = getTabOrder(container);
  const tabbed: HTMLElement[] = [];
  let currentIndex = -1;

  for (let i = 0; i < count && order.length > 0; i++) {
    currentIndex = reverse ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0) {
      currentIndex = order.length - 1;
    } else if (currentIndex >= order.length) {
      currentIndex = 0;
    }
    tabbed.push(order[currentIndex]);
  }

  return tabbed;
}

/**
 * Check if trap focus (modal) is working
 */
export function checkFocusTrap(modalElement: HTMLElement): boolean {
  const focusable = getFocusableElements(modalElement);
  if (focusable.length === 0) return true;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  return (
    first instanceof HTMLElement &&
    last instanceof HTMLElement &&
    first !== last
  );
}

/**
 * Get the currently focused element
 */
export function getFocusedElement(): HTMLElement | null {
  return document.activeElement as HTMLElement;
}

/**
 * Focus an element and trigger focus event
 */
export function focusElement(element: HTMLElement): void {
  element.focus({ preventScroll: true });
  element.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
}

/**
 * Simulate pressing Enter or Space on an element
 */
export function activateElement(element: HTMLElement): void {
  if (element.tagName === 'BUTTON' || element.tagName === 'A') {
    dispatchKeyboardEvent(element, 'keydown', 'Enter');
    element.click();
  } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    if ((element as HTMLInputElement).type === 'checkbox' || (element as HTMLInputElement).type === 'radio') {
      dispatchKeyboardEvent(element, 'keydown', ' ');
      (element as HTMLInputElement).click();
    } else {
      (element as HTMLInputElement).focus();
    }
  }
}
