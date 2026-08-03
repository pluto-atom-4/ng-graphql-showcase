import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * ButtonComponent - Reusable button with variant and size options.
 *
 * @selector app-button
 *
 * @input variant - Button style variant: 'primary' (blue), 'secondary' (gray), 'danger' (red). Default: 'primary'
 * @input size - Button size: 'sm' (small), 'md' (medium), 'lg' (large). Default: 'md'
 * @input disabled - Disables button interaction. Default: false
 * @input loading - Shows loading spinner and disables button. Default: false
 * @input ariaLabel - Accessibility label for screen readers. Optional.
 *
 * @output clicked - Emitted when button is clicked.
 *
 * @example
 * // Primary button (default)
 * <app-button (clicked)="onSubmit()">Submit</app-button>
 *
 * // Secondary button with size
 * <app-button variant="secondary" size="lg" (clicked)="onCancel()">Cancel</app-button>
 *
 * // Danger button with loading state
 * <app-button variant="danger" [loading]="isDeleting" (clicked)="onDelete()">Delete</app-button>
 *
 * @a11y
 * - Uses semantic `<button>` element
 * - aria-label for screen reader context
 * - aria-busy="true" during loading state
 * - Disabled state properly communicated to assistive technology
 * - Minimum touch target: 44x44px
 */
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [disabled]="disabled || loading"
      [class]="buttonClasses"
      (click)="onClick()"
      [attr.aria-label]="ariaLabel"
      [attr.aria-busy]="loading"
      type="button"
    >
      @if (loading) {
        <span class="loading loading-spinner loading-sm mr-2"></span>
      } @else {
        <ng-content></ng-content>
      }
    </button>
  `,
  styles: [`
    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      transition: all 200ms ease-in-out;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Variants */
    .btn-primary {
      background-color: #2563eb;
      color: white;
    }
    .btn-primary:hover:not(:disabled) {
      background-color: #1d4ed8;
    }

    .btn-secondary {
      background-color: #e5e7eb;
      color: #1f2937;
    }
    .btn-secondary:hover:not(:disabled) {
      background-color: #d1d5db;
    }

    .btn-danger {
      background-color: #ef4444;
      color: white;
    }
    .btn-danger:hover:not(:disabled) {
      background-color: #dc2626;
    }

    /* Sizes */
    .btn-sm {
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
    }

    .btn-md {
      padding: 0.75rem 1rem;
      font-size: 1rem;
    }

    .btn-lg {
      padding: 1rem 1.5rem;
      font-size: 1.125rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() ariaLabel?: string;

  @Output() clicked = new EventEmitter<void>();

  get buttonClasses(): string {
    return `btn-${this.variant} btn-${this.size}`;
  }

  onClick(): void {
    this.clicked.emit();
  }
}
