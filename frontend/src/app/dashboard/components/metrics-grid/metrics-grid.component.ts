import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetricCardComponent } from './metric-card.component';

export interface Metrics {
  total: number;
  inProgress: number;
  completed: number;
  failed: number;
}

/**
 * MetricsGridComponent - Displays build metrics in a responsive grid.
 *
 * @selector app-metrics-grid
 *
 * @input metrics - Metrics object with counts for total, inProgress, completed, failed.
 *   Default: { total: 0, inProgress: 0, completed: 0, failed: 0 }
 *
 * @example
 * // Display build metrics
 * <app-metrics-grid
 *   [metrics]="{ total: 100, inProgress: 12, completed: 75, failed: 13 }"
 * ></app-metrics-grid>
 *
 * @a11y
 * - Grid layout with responsive columns (1 on mobile, 2 on tablet, 4 on desktop)
 * - Each MetricCard has proper ARIA labels (via child component)
 */
@Component({
  selector: 'app-metrics-grid',
  standalone: true,
  imports: [CommonModule, MetricCardComponent],
  template: `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <app-metric-card
        label="Total Builds"
        [count]="metrics.total"
        status="total"
      ></app-metric-card>

      <app-metric-card
        label="In Progress"
        [count]="metrics.inProgress"
        status="inProgress"
      ></app-metric-card>

      <app-metric-card
        label="Completed"
        [count]="metrics.completed"
        status="completed"
      ></app-metric-card>

      <app-metric-card
        label="Failed"
        [count]="metrics.failed"
        status="failed"
      ></app-metric-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetricsGridComponent {
  @Input() metrics: Metrics = {
    total: 0,
    inProgress: 0,
    completed: 0,
    failed: 0
  };
}
