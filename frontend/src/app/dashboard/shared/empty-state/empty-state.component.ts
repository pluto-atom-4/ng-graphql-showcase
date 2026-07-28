import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

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
