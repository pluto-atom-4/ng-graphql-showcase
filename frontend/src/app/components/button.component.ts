import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Reusable Button component using daisyUI
 *
 * Example:
 * <app-button
 *   label="Click Me"
 *   variant="primary"
 *   size="md"
 *   [loading]="isLoading"
 *   (click)="handleClick()"
 * />
 */
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- 3. Read the signals/computed values directly in the template by calling them () -->
    <button
      [attr.disabled]="isDisabled() ? true : null"
      [ngClass]="classes()"
      (click)="onClickHandler()"
    >
      @if (!loading()) {
        <span>{{ label() }}</span>
      }
      @if (loading()) {
        <span class="loading loading-spinner loading-sm"></span>
      }
    </button>
  `,
})
export class ButtonComponent {
  // 1. Declare inputs using the new input() function (they become read-only signals)
  label = input<string>('Button');
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  loading = input<boolean>(false);
  disabled = input<boolean>(false);

  // 2. Declare outputs using the new output() function
  trigger = output<void>();

  // 4. Use computed() to automatically update state derived from inputs
  isDisabled = computed(() => this.disabled() || this.loading());

  classes = computed(() => {
    const base = 'btn font-semibold transition-all';
    const variantClass = `btn-${this.variant()}`;
    const sizeClass = this.size() === 'md' ? '' : `btn-${this.size()}`;

    return [base, variantClass, sizeClass].filter(Boolean).join(' ');
  });

  onClickHandler(): void {
    if (!this.isDisabled()) {
      this.trigger.emit();
    }
  }
}

