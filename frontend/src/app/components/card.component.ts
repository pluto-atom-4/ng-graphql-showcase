import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  imports: [CommonModule],
  template: `
    <div class="card-factory">
      <div class="card-body">
        <h2 *ngIf="title" class="card-title">{{ title }}</h2>
        <p *ngIf="description" class="text-gray-600">{{ description }}</p>
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class CardComponent {
  @Input() title?: string;
  @Input() description?: string;
}
