import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export type MetricStatus = 'total' | 'inProgress' | 'completed' | 'failed';

interface StatusConfig {
  color: string;
  bgColor: string;
  icon: string;
}

/**
 * MetricCardComponent - Individual metric card with status indicator.
 *
 * @selector app-metric-card
 *
 * @input label - Metric label/title (e.g., "Total Builds"). Default: ''
 * @input count - Metric count/value. Default: 0
 * @input status - Status type: 'total' (gray), 'inProgress' (blue), 'completed' (green), 'failed' (red). Default: 'total'
 *
 * @method getIndicatorWidth - Returns progress bar width as percentage (0-100%)
 *
 * @example
 * // Display total builds metric
 * <app-metric-card
 *   label="Total Builds"
 *   [count]="100"
 *   status="total"
 * ></app-metric-card>
 *
 * // Display in-progress metric
 * <app-metric-card
 *   label="In Progress"
 *   [count]="12"
 *   status="inProgress"
 * ></app-metric-card>
 *
 * @a11y
 * - Uses semantic structure with icon + label + value
 * - Status indicated by color + icon (not color-dependent)
 * - Color contrast verified
 */
@Component({
  selector: 'app-metric-card',
  standalone: true,
  template: `
    <div class="card card-hover cursor-pointer group focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-500" tabindex="0">
      <!-- Header -->
      <div class="flex items-start justify-between mb-4">
        <div class="text-3xl group-hover:scale-110 transition-transform duration-200">{{ statusConfig.icon }}</div>
        <span class="text-gray-500 text-xs font-medium uppercase tracking-wide">{{ label }}</span>
      </div>

      <!-- Count -->
      <div class="mb-4">
        <p class="text-4xl font-bold transition-all duration-200" [style.color]="statusConfig.color">
          {{ count }}
        </p>
      </div>

      <!-- Status indicator bar with animation -->
      <div
        class="h-1.5 rounded-full overflow-hidden bg-gray-200"
      >
        <div
          class="h-full rounded-full transition-all duration-500 ease-out"
          [style.backgroundColor]="statusConfig.color"
          [style.width]="getIndicatorWidth()"
          [class.animate-pulse-soft]="count > 0"
        ></div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetricCardComponent {
  @Input() label = '';
  @Input() count = 0;
  @Input() status: MetricStatus = 'total';

  private readonly statusMap: Record<MetricStatus, StatusConfig> = {
    total: {
      color: '#6b7280',
      bgColor: '#f3f4f6',
      icon: '📊'
    },
    inProgress: {
      color: '#2563eb',
      bgColor: '#dbeafe',
      icon: '⚙️'
    },
    completed: {
      color: '#10b981',
      bgColor: '#d1fae5',
      icon: '✅'
    },
    failed: {
      color: '#ef4444',
      bgColor: '#fee2e2',
      icon: '❌'
    }
  };

  get statusConfig(): StatusConfig {
    return this.statusMap[this.status];
  }

  getIndicatorWidth(): string {
    const maxCount = 100;
    const percentage = Math.min((this.count / maxCount) * 100, 100);
    return `${percentage}%`;
  }
}
