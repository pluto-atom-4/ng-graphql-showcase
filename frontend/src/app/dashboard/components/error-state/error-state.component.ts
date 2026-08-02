import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * ErrorStateComponent
 *
 * Displays an error state with icon, message, and retry button.
 * Used when data loading fails or an error occurs.
 *
 * Emits:
 * - retry: Emitted when the Retry button is clicked
 *
 * Usage:
 *   <app-error-state
 *     [icon]="'⚠️'"
 *     [title]="'Failed to load'"
 *     [message]="'Unable to fetch builds'"
 *     (retry)="onRetry()"
 *   ></app-error-state>
 */
@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center py-16 px-4">
      <!-- Icon -->
      <div class="text-6xl mb-4 text-red-400">
        {{ icon }}
      </div>

      <!-- Title -->
      <h2 class="text-xl font-semibold text-gray-900 mb-2">
        {{ title }}
      </h2>

      <!-- Message -->
      <p class="text-gray-600 text-center max-w-md mb-6">
        {{ message }}
      </p>

      <!-- Error Details (optional) -->
      <div
        *ngIf="errorDetails"
        class="bg-red-50 border border-red-200 rounded px-3 py-2 mb-6 max-w-md text-sm text-red-700 text-center"
        role="region"
        aria-label="Error details"
      >
        {{ errorDetails }}
      </div>

      <!-- Retry Button -->
      <button
        type="button"
        (click)="onRetry()"
        class="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        [attr.aria-label]="'Retry: ' + title"
      >
        Try Again
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
export class ErrorStateComponent {
  @Input() icon = '⚠️';
  @Input() title = 'Something went wrong';
  @Input() message = 'An unexpected error occurred';
  @Input() errorDetails?: string;

  @Output() retry = new EventEmitter<void>();

  onRetry(): void {
    this.retry.emit();
  }
}
