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
 * ModalContainerComponent
 *
 * Wraps modal content with backdrop, animations, and focus management.
 * Handles:
 * - Backdrop click to close
 * - Escape key to close (if enabled)
 * - Focus trap (if enabled)
 * - Focus restore on close (if enabled)
 * - Animations (fade-in)
 *
 * Usage:
 *   <app-modal-container
 *     [config]="modalConfig"
 *     (close)="onModalClose()"
 *   >
 *     <h2>Modal Title</h2>
 *     <p>Modal content goes here</p>
 *   </app-modal-container>
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
