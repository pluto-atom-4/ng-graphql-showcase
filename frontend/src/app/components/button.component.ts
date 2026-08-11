import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Reusable button component built with Tailwind CSS + Angular 19 signals.
 *
 * **Features**:
 * - OnPush change detection (performance optimized)
 * - Signals-based inputs/outputs (reactive API)
 * - Computed disabled state (loading OR disabled input)
 * - Semantic Tailwind classes for variants & sizes
 *
 * **Signals**:
 * - @input label: Button text (default: "Button")
 * - @input variant: ButtonVariant (primary|secondary|accent|ghost|outline)
 * - @input size: ButtonSize (xs|sm|md|lg)
 * - @input loading: Show spinner overlay
 * - @input disabled: Prevent clicks
 * - @output trigger: Emits on click (if not disabled)
 *
 * **Design System**: {@link frontend/README.md#buttons}
 *
 * **Example**:
 * ```typescript
 * <app-button
 *   label="Save"
 *   variant="primary"
 *   size="md"
 *   [loading]="isSaving()"
 *   (trigger)="handleSave()"
 * />
 * ```
 *
 * **Implementation Notes**:
 * - Uses computed() to derive isDisabled state from inputs
 * - Classes computed dynamically from variant/size inputs
 * - Blocks clicks when disabled OR loading
 */
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [attr.disabled]="isDisabled() ? true : null"
      [ngClass]="classes()"
      (click)="onClickHandler()"
    >
      @if (loading()) {
        <span class="inline-block w-4 h-4 border-2 border-gray-300 border-t-current rounded-full animate-spin"></span>
      } @else {
        <span>{{ label() }}</span>
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
    const base = 'button-base font-semibold transition-all';
    const variantClass = this.getVariantClass(this.variant());
    const sizeClass = this.getSizeClass(this.size());
    const disabledClass = this.isDisabled() ? 'button-disabled' : '';

    return [base, variantClass, sizeClass, disabledClass].filter(Boolean).join(' ');
  });

  private getVariantClass(variant: ButtonVariant): string {
    const variants: Record<ButtonVariant, string> = {
      'primary': 'button-primary',
      'secondary': 'button-secondary',
      'accent': 'button-primary', // Map accent to primary
      'ghost': 'button-ghost',
      'outline': 'button-ghost', // Map outline to ghost
    };
    return variants[variant] || 'button-primary';
  }

  private getSizeClass(size: ButtonSize): string {
    const sizes: Record<ButtonSize, string> = {
      'xs': 'px-2 py-1 text-xs',
      'sm': 'px-3 py-1.5 text-sm',
      'md': '', // Default size (already in button-base)
      'lg': 'px-6 py-3 text-lg',
    };
    return sizes[size] || '';
  }

  onClickHandler(): void {
    if (!this.isDisabled()) {
      this.trigger.emit();
    }
  }
}

