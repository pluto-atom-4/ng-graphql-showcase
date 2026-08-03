import { Injectable } from '@angular/core';

/**
 * FocusRestoreService - Restores focus to trigger element after modal closes.
 *
 * Handles focus management lifecycle for modals/overlays:
 * 1. When modal opens: Save the button/link that triggered it
 * 2. When modal closes: Restore focus to that element
 * 3. Optionally smooth-scroll element into view
 *
 * @example
 * // In ModalContainerComponent.ngAfterViewInit
 * if (this.triggerElement && this.config.restoreFocus !== false) {
 *   this.focusRestore.saveTrigger(this.triggerElement);
 * }
 *
 * // In ModalContainerComponent.ngOnDestroy
 * if (this.config.restoreFocus !== false) {
 *   this.focusRestore.restore();
 * }
 *
 * @a11y
 * - Fulfills WCAG 2.1 focus management requirement (Level AA)
 * - Helps keyboard users return to logical position after modal close
 * - Smooth scroll prevents jarring page jumps
 * - Returns focus to interactive element, not generic container
 */
@Injectable({
  providedIn: 'root'
})
export class FocusRestoreService {
  private triggerElement: HTMLElement | null = null;

  /**
   * Saves the trigger element for later restoration
   *
   * @param element - The element that triggered opening the overlay
   */
  saveTrigger(element: HTMLElement): void {
    this.triggerElement = element;
  }

  /**
   * Restores focus to the previously saved trigger element
   */
  restore(): void {
    if (this.triggerElement) {
      this.triggerElement.focus();
      // Scroll into view to ensure the element is visible
      this.triggerElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      this.triggerElement = null;
    }
  }

  /**
   * Clears the stored trigger element without restoring focus
   */
  clear(): void {
    this.triggerElement = null;
  }

  /**
   * Gets the currently stored trigger element
   *
   * @returns The trigger element or null if none is stored
   */
  getTrigger(): HTMLElement | null {
    return this.triggerElement;
  }
}
