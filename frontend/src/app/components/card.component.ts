import { Component, Input, ChangeDetectionStrategy } from '@angular/core';


/**
 * Semantic container component built with daisyUI.
 *
 * Wraps content in a card layout with optional title and description.
 * Provides consistent spacing, shadows, and theming via daisyUI.
 *
 * **Features**:
 * - OnPush change detection (no performance overhead)
 * - Optional title and description headers
 * - ng-content slot for flexible body content
 * - daisyUI card-factory class (rounded corners, shadow, padding)
 *
 * **Inputs**:
 * - title?: string — Card header title
 * - description?: string — Subtitle/description text
 *
 * **Design System**: {@link docs/FRONTEND-DESIGN-SYSTEM.md#cards}
 *
 * **Example**:
 * ```typescript
 * <app-card title="Build Status" description="Real-time updates">
 *   <div class="space-y-4">
 *     <p>Metrics here</p>
 *     <app-button label="Action" variant="primary" />
 *   </div>
 * </app-card>
 * ```
 *
 * **Related**: BuildProgressCardComponent (complex example using Card)
 */
@Component({
  selector: 'app-card',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card-factory">
      <div class="card-body">
        @if (title) {
          <h2 class="card-title">{{ title }}</h2>
        }
        @if (description) {
          <p class="text-gray-600">{{ description }}</p>
        }
        <ng-content></ng-content>
      </div>
    </div>
    `,
})
export class CardComponent {
  @Input() title?: string;
  @Input() description?: string;
}
