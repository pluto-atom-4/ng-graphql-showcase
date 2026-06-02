import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  imports: [CommonModule],
  template: `
    <dialog
      class="modal"
      [class.modal-open]="isOpen"
      (backdrop)="onCloseClick()"
    >
      <div class="modal-box">
        <h3 class="font-bold text-lg">{{ title }}</h3>
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
            {{ confirmLabel }}
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
  @Input() title = 'Modal Title';
  @Input() confirmLabel = 'Confirm';
  @Input() isOpen = false;
  @Output() onClose = new EventEmitter<void>();
  @Output() onConfirm = new EventEmitter<void>();

  onCloseClick(): void {
    this.onClose.emit();
  }

  onConfirmClick(): void {
    this.onConfirm.emit();
  }
}
