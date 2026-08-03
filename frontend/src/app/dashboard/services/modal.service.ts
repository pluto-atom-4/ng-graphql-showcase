import { Injectable, Injector, ComponentRef, inject } from '@angular/core';
import { Subject } from 'rxjs';

export interface ModalConfig {
  backdrop?: boolean;
  closeOnEscape?: boolean;
  focusTrap?: boolean;
  restoreFocus?: boolean;
  size?: 'sm' | 'md' | 'lg';
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
}

export interface ModalRef<T = any> {
  id: string;
  close: (result?: T) => void;
  result$: Subject<T>;
}

/**
 * ModalService - Manages modal lifecycle and stacking.
 *
 * Provides centralized modal management:
 * - open(component, config): Open modal and get ModalRef
 * - close(id, result): Close specific modal with optional result
 * - closeAll(): Close all open modals
 * - hasOpenModals(): Check if any modals are open
 *
 * Supports stacking: Multiple modals can be open simultaneously (LIFO)
 *
 * @example
 * // Open modal and subscribe to result
 * const ref = this.modal.open(BuildDetailsModalComponent, { size: 'md' });
 * ref.result$.subscribe(result => {
 *   console.log('Modal closed with result:', result);
 * });
 *
 * // Close modal from within component
 * ref.close({ saved: true });
 *
 * // Check if modals are open
 * if (this.modal.hasOpenModals()) {
 *   // Prevent navigation/close
 * }
 */
@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private injector = inject(Injector);
  private modals: Map<string, ModalRef> = new Map();
  private nextId = 0;

  /**
   * Opens a modal with the given component
   *
   * @param component - The component to display in the modal
   * @param config - Configuration options for the modal
   * @returns ModalRef for controlling the modal
   */
  open<T>(
    component: any,
    config: ModalConfig = {}
  ): ModalRef<T> {
    const id = `modal-${this.nextId++}`;
    const result$ = new Subject<T>();

    const ref: ModalRef<T> = {
      id,
      close: (result?: T) => {
        this.close(id, result);
      },
      result$
    };

    this.modals.set(id, ref);

    // Note: In the actual ModalContainerComponent implementation,
    // we'll handle the DOM insertion and component rendering
    // This service manages the references and lifecycle

    return ref;
  }

  /**
   * Closes a modal by its ID
   *
   * @param id - The modal ID
   * @param result - Optional result to emit
   */
  close<T = any>(id: string, result?: T): void {
    const ref = this.modals.get(id);
    if (ref) {
      (ref.result$ as Subject<T>).next(result);
      (ref.result$ as Subject<T>).complete();
      this.modals.delete(id);
    }
  }

  /**
   * Closes all open modals
   */
  closeAll(): void {
    for (const [id, ref] of this.modals.entries()) {
      (ref.result$ as Subject<any>).complete();
    }
    this.modals.clear();
  }

  /**
   * Gets a modal ref by ID
   *
   * @param id - The modal ID
   * @returns The ModalRef or undefined
   */
  getModal(id: string): ModalRef | undefined {
    return this.modals.get(id);
  }

  /**
   * Gets all open modals
   *
   * @returns Array of ModalRefs
   */
  getAllModals(): ModalRef[] {
    return Array.from(this.modals.values());
  }

  /**
   * Checks if there are any open modals
   *
   * @returns True if there are open modals
   */
  hasOpenModals(): boolean {
    return this.modals.size > 0;
  }
}
