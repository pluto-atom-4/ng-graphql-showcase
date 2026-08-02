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
 * ModalService
 *
 * Provides a service to open and manage modal dialogs.
 * Handles stacking of modals, closing, and event management.
 *
 * Usage:
 *   const ref = this.modal.open(MyModalComponent, { size: 'md' });
 *   ref.result$.subscribe(result => {
 *     console.log('Modal closed with result:', result);
 *   });
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
