import { Component, Input, ChangeDetectionStrategy } from '@angular/core';


/**
 * Reusable Card component using daisyUI
 *
 * Example:
 * <app-card
 *   title="Build Status"
 *   description="Current build metrics"
 * >
 *   <div>Card content goes here</div>
 * </app-card>
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
