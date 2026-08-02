import { Injectable } from '@angular/core';

/**
 * FocusRestoreService
 *
 * Manages focus restoration for modal/overlay interactions.
 * Stores the element that triggered opening a modal/overlay,
 * then restores focus to that element when the overlay closes.
 *
 * Usage:
 *   // When opening a modal:
 *   this.focusRestore.saveTrigger(triggerElement);
 *
 *   // When closing:
 *   this.focusRestore.restore();
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
