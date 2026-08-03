import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * EmptyStateComponent - Displays empty state message with optional call-to-action button.
 *
 * @selector app-empty-state
 *
 * @input icon - Emoji or symbol to display. Default: '📭'
 * @input title - Main heading text. Default: 'No data found'
 * @input description - Secondary description text. Default: 'Try adjusting your filters or search criteria'
 * @input ctaLabel - Button label; if empty, button is hidden. Optional.
 *
 * @output cta - Emitted when CTA button is clicked.
 *
 * @example
 * // Default empty state
 * <app-empty-state></app-empty-state>
 *
 * // With custom message and CTA
 * <app-empty-state
 *   icon="🔍"
 *   title="No builds found"
 *   description="Create your first build to get started"
 *   ctaLabel="Create Build"
 *   (cta)="navigateToCreateBuild()"
 * ></app-empty-state>
 *
 * @a11y
 * - h2 for main title (semantic hierarchy)
 * - Button has aria-label for accessibility
 * - Focus-visible styles for keyboard navigation
 * - Semantic button element
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center py-16 px-4">
      <!-- Icon -->
      <div class="text-6xl mb-4 text-gray-400">
        {{ icon }}
      </div>

      <!-- Message -->
      <h2 class="text-xl font-semibold text-gray-900 mb-2">
        {{ title }}
      </h2>
      <p class="text-gray-600 text-center max-w-md mb-6">
        {{ description }}
      </p>

      <!-- CTA Button -->
      <button
        *ngIf="ctaLabel"
        type="button"
        (click)="onCta()"
        class="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors"
        [attr.aria-label]="ctaLabel"
      >
        {{ ctaLabel }}
      </button>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    button {
      transition: all 200ms ease-in-out;
    }

    button:focus-visible {
      outline: 2px solid #2563eb;
      outline-offset: 2px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  @Input() icon = '📭';
  @Input() title = 'No data found';
  @Input() description = 'Try adjusting your filters or search criteria';
  @Input() ctaLabel?: string;

  @Output() cta = new EventEmitter<void>();

  onCta(): void {
    this.cta.emit();
  }
}
