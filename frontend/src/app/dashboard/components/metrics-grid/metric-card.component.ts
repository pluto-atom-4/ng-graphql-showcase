import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export type MetricStatus = 'total' | 'inProgress' | 'completed' | 'failed';

interface StatusConfig {
  color: string;
  bgColor: string;
  icon: string;
}

@Component({
  selector: 'app-metric-card',
  standalone: true,
  template: `
    <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
      <!-- Header -->
      <div class="flex items-start justify-between mb-4">
        <div class="text-3xl">{{ statusConfig.icon }}</div>
        <span class="text-gray-500 text-xs font-medium">{{ label }}</span>
      </div>

      <!-- Count -->
      <div class="mb-2">
        <p class="text-3xl font-bold" [style.color]="statusConfig.color">
          {{ count }}
        </p>
      </div>

      <!-- Status indicator -->
      <div
        class="h-1 rounded-full"
        [style.backgroundColor]="statusConfig.color"
        [style.width]="getIndicatorWidth()"
      ></div>
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
