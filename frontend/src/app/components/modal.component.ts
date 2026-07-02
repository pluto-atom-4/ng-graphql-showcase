import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

/**
 * Dialog/modal component for confirmations and user interaction.
 *
 * Displays content in a modal dialog with cancel/confirm buttons.
 * Uses HTML5 dialog element with daisyUI styling. Backdrop click
 * triggers close (handled by form method="dialog" pattern).
 *
 * **Features**:
 * - OnPush change detection
 * - Signals-based inputs/outputs (title, isOpen, confirmLabel)
 * - Semantic button layout (Cancel/Confirm)
 * - Flexible content via ng-content
 * - daisyUI modal styling with proper backdrop handling
 *
 * **Signals**:
 * - @input title: string (default: "Modal Title")
 * - @input confirmLabel: string (default: "Confirm")
 * - @input isOpen: boolean — Controls visibility
 * - @output closeModal: Emits when user clicks Cancel or backdrop
 * - @output confirm: Emits when user clicks Confirm button
 *
 * **Design System**: {@link docs/FRONTEND-DESIGN-SYSTEM.md#modals}
 *
 * **Example**:
 * ```typescript
 * showDeleteModal = signal(false);
 *
 * <app-modal
 *   title="Delete Build?"
 *   confirmLabel="Delete"
 *   [isOpen]="showDeleteModal()"
 *   (closeModal)="showDeleteModal.set(false)"
 *   (confirm)="deleteBuild(); showDeleteModal.set(false)"
 * >
 *   <p>This action cannot be undone.</p>
 * </app-modal>
 * ```
 *
 * **Implementation**: Uses HTML dialog element with form method="dialog"
 * for automatic backdrop handling (no manual escape key handling needed).
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      class="modal"
      [class.modal-open]="isOpen()"
      [attr.open]="isOpen() ? '' : null"
    >
      <div class="modal-box">
        <h3 class="font-bold text-lg">{{ title() }}</h3>
        <div class="py-4">
          <ng-content></ng-content>
        </div>
        <div class="modal-action">
          <button
            type="button"
            class="btn btn-ghost"
            (click)="onCloseClick()"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary"
            (click)="onConfirmClick()"
          >
            {{ confirmLabel() }}
          </button>
        </div>
      </div>
      <!-- DaisyUI backdrop handles the background clicks safely here -->
      <form method="dialog" class="modal-backdrop">
        <button type="button" (click)="onCloseClick()">close</button>
      </form>
    </dialog>
  `,
})
export class ModalComponent {
  title = input<string>('Modal Title');
  confirmLabel = input<string>('Confirm');
  isOpen = input<boolean>(false);

  closeModal = output<void>();
  confirm = output<void>();

  onCloseClick(): void {
    this.closeModal.emit();
  }

  onConfirmClick(): void {
    this.confirm.emit();
  }
}

