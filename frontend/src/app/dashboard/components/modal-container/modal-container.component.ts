import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalConfig } from '../../services/modal.service';
import { FocusTrapService } from '../../services/focus-trap.service';
import { FocusRestoreService } from '../../services/focus-restore.service';

/**
 * ModalContainerComponent - Accessible modal wrapper with backdrop, focus management, and animations.
 *
 * @selector app-modal-container
 *
 * @input config - ModalConfig object with backdrop, closeOnEscape, focusTrap, restoreFocus, size, ariaLabelledBy, ariaDescribedBy
 * @input triggerElement - HTMLElement that triggered the modal (used for focus restoration). Optional.
 *
 * @output close - Emitted when modal should close (backdrop click, Escape key)
 *
 * @example
 * // Basic modal
 * <app-modal-container
 *   [config]="{ size: 'md', focusTrap: true, restoreFocus: true }"
 *   (close)="isModalOpen = false"
 * >
 *   <h2>Delete Build?</h2>
 *   <p>This action cannot be undone.</p>
 *   <button (click)="onDelete()">Delete</button>
 *   <button (click)="isModalOpen = false">Cancel</button>
 * </app-modal-container>
 *
 * @a11y
 * - role="dialog" on modal container
 * - aria-modal="true" to indicate modal
 * - aria-labelledby for modal title (from config)
 * - aria-describedby for modal description (from config)
 * - Focus trap: Tab/Shift+Tab cycles within modal
 * - Escape key closes modal (if closeOnEscape enabled)
 * - Focus automatically moves to first focusable element
 * - Focus restored to trigger element on close
 * - Backdrop has aria-hidden="true"
 */
@Component({
  selector: 'app-modal-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Backdrop -->
    <div
      *ngIf="config?.backdrop !== false"
      class="fixed inset-0 bg-black/50 z-40 animate-fade-in"
      [attr.aria-hidden]="'true'"
      (click)="onBackdropClick()"
    ></div>

    <!-- Modal -->
    <div
      #modalContent
      class="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
      [attr.aria-modal]="'true'"
      [attr.aria-labelledby]="config?.ariaLabelledBy"
      [attr.aria-describedby]="config?.ariaDescribedBy"
      role="dialog"
    >
      <div
        class="pointer-events-auto bg-white rounded-lg shadow-lg animate-fade-in"
        [ngClass]="modalSizeClass"
      >
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .animate-fade-in {
      animation: fadeIn 300ms ease-in-out forwards;
    }

    .modal-sm {
      width: 90%;
      max-width: 384px;
    }

    .modal-md {
      width: 90%;
      max-width: 512px;
    }

    .modal-lg {
      width: 90%;
      max-width: 640px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalContainerComponent implements AfterViewInit, OnDestroy {
  @Input() config: ModalConfig = {};
  @Input() triggerElement?: HTMLElement;

  @Output() close = new EventEmitter<void>();

  @ViewChild('modalContent', { read: ElementRef }) modalContent?: ElementRef;

  private unsubscribeFocusTrap?: () => void;

  constructor(
    private focusTrap: FocusTrapService,
    private focusRestore: FocusRestoreService
  ) {}

  ngAfterViewInit(): void {
    if (!this.modalContent) return;

    const container = this.modalContent.nativeElement;

    // Save trigger element for focus restore
    if (this.triggerElement && this.config.restoreFocus !== false) {
      this.focusRestore.saveTrigger(this.triggerElement);
    }

    // Activate focus trap
    if (this.config.focusTrap !== false) {
      this.unsubscribeFocusTrap = this.focusTrap.trap(container);
    }

    // Focus first focusable element
    const firstFocusable = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }

  ngOnDestroy(): void {
    if (this.unsubscribeFocusTrap) {
      this.unsubscribeFocusTrap();
    }

    // Restore focus
    if (this.config.restoreFocus !== false) {
      this.focusRestore.restore();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.config.closeOnEscape !== false) {
      this.close.emit();
    }
  }

  onBackdropClick(): void {
    if (this.config.backdrop !== false) {
      this.close.emit();
    }
  }

  get modalSizeClass(): string {
    const sizeMap = {
      sm: 'modal-sm',
      md: 'modal-md',
      lg: 'modal-lg'
    };
    return sizeMap[this.config.size || 'md'];
  }
}
