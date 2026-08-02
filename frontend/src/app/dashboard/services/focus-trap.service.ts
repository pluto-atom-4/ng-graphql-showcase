import { Injectable } from '@angular/core';

/**
 * FocusTrapService
 *
 * Manages focus trapping within a container element. When activated,
 * ensures Tab/Shift+Tab navigation is confined within the focusable
 * elements of the container.
 *
 * Usage:
 *   const unsubscribe = this.focusTrap.trap(containerElement);
 *   // On close:
 *   unsubscribe();
 */
@Injectable({
  providedIn: 'root'
})
export class FocusTrapService {
  /**
   * Selectors for naturally focusable elements
   */
  private readonly focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    'iframe',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(',');

  /**
   * Activates focus trap for the given container element.
   * Returns an unsubscribe function to deactivate the trap.
   *
   * @param container - The element within which focus should be trapped
   * @returns Function to deactivate the trap
   */
  trap(container: HTMLElement): () => void {
    const keyDownListener = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = this.getFocusableElements(container);
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const activeElement = document.activeElement as HTMLElement;
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift+Tab: move backwards
        if (activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: move forwards
        if (activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', keyDownListener);

    return () => {
      container.removeEventListener('keydown', keyDownListener);
    };
  }

  /**
   * Gets all focusable elements within the container
   *
   * @param container - The container element to search
   * @returns Array of focusable elements
   */
  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const elements = Array.from(
      container.querySelectorAll(this.focusableSelectors)
    ) as HTMLElement[];

    return elements.filter((el) => {
      // Check if element is visible
      if (el.offsetParent === null) {
        return false;
      }

      // Check if element or a parent has display: none or visibility: hidden
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') {
        return false;
      }

      return true;
    });
  }
}
