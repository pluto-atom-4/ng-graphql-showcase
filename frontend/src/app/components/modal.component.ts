import { Component, input, output } from '@angular/core';

/**
 * Reusable Modal component using daisyUI
 *
 * Example:
 * <app-modal
 *   title="Confirm Action"
 *   [isOpen]="showModal"
 *   (onClose)="showModal = false"
 *   (onConfirm)="handleConfirm()"
 * >
 *   <p>Are you sure?</p>
 * </app-modal>
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [],
  template: `
    <dialog
      class="modal"
      [class.modal-open]="isOpen()"
      (backdrop)="onCloseClick()"
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
      <form method="dialog" class="modal-backdrop">
        <button (click)="onCloseClick()">close</button>
      </form>
    </dialog>
  `,
})
export class ModalComponent {
  // 1. Convert inputs to Signals
  title = input<string>('Modal Title');
  confirmLabel = input<string>('Confirm');
  isOpen = input<boolean>(false);

  // 2. Clear out 'on' prefixes and avoid native DOM clashes
  closeModal = output<void>();
  confirm = output<void>();

  onCloseClick(): void {
    this.closeModal.emit();
  }

  onConfirmClick(): void {
    this.confirm.emit();
  }
}
