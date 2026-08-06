import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { BadgeComponent } from '../../shared/badge/badge.component';

export interface Activity {
  id: string;
  timestamp: string;
  description: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETE' | 'FAILED';
}

/**
 * ActivityTimelineComponent - Vertical timeline of activities with performance optimization.
 *
 * @selector app-activity-timeline
 *
 * @input activities - Array of Activity objects. Virtual scrolling used for >100 items. Default: []
 *
 * @method trackByActivityId - TrackBy function for *ngFor loop optimization using activity.id
 *
 * @example
 * // Display activity timeline
 * <app-activity-timeline
 *   [activities]="[
 *     { id: '1', timestamp: '2024-01-01T10:00:00Z', description: 'Build started', status: 'RUNNING' },
 *     { id: '2', timestamp: '2024-01-01T10:30:00Z', description: 'Build completed', status: 'COMPLETE' }
 *   ]"
 * ></app-activity-timeline>
 *
 * @performance
 * - trackBy function on all *ngFor loops
 * - Virtual scrolling (CDK) for lists >100 items
 * - Non-virtualized for ≤100 items (reduced memory overhead)
 * - Timestamp formatting with relative time (e.g., "5m ago")
 *
 * @a11y
 * - role="list" on container
 * - Each activity item is a list item
 * - Badge component provides status accessibility
 * - Semantic HTML structure
 */
@Component({
  selector: 'app-activity-timeline',
  standalone: true,
  imports: [CommonModule, ScrollingModule, BadgeComponent],
  template: `
    <div class="space-y-4" role="list">
      <div *ngIf="activities.length === 0" class="empty-state py-8">
        <div class="empty-state-icon text-4xl">📝</div>
        <p class="empty-state-text">No activities yet</p>
      </div>

      <div *ngIf="activities.length > 0 && activities.length <= 100" class="space-y-4">
        <!-- Non-virtualized rendering for ≤100 items -->
        <div
          *ngFor="let activity of activities; trackBy: trackByActivityId"
          class="flex gap-2 md:gap-4 animate-slide-in"
          role="listitem"
        >
          <!-- Timeline line -->
          <div class="flex flex-col items-center">
            <div class="w-2.5 md:w-3 h-2.5 md:h-3 rounded-full bg-blue-600 mt-1.5 md:mt-1.5"></div>
            <div
              class="w-0.5 bg-gray-200 flex-1"
              [style.height.rem]="3.5"
            ></div>
          </div>

          <!-- Content -->
          <div class="pb-4 flex-1 min-w-0">
            <div class="flex flex-col md:flex-row md:items-center md:gap-3 gap-1">
              <p class="text-xs md:text-sm font-medium text-gray-900 break-words">
                {{ activity.description }}
              </p>
              <app-badge [status]="activity.status"></app-badge>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              {{ formatTimestamp(activity.timestamp) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Virtual scroll for >100 items -->
      <div *ngIf="activities.length > 100">
        <cdk-virtual-scroll-viewport itemSize="56" class="h-[600px] overflow-y-auto">
          <div
            *cdkVirtualFor="let activity of activities; trackBy: trackByActivityId"
            class="flex gap-2 md:gap-4 py-2"
            role="listitem"
          >
            <!-- Timeline line -->
            <div class="flex flex-col items-center">
              <div class="w-2.5 md:w-3 h-2.5 md:h-3 rounded-full bg-blue-600 mt-1.5"></div>
              <div
                class="w-0.5 bg-gray-200 flex-1"
                [style.height.rem]="3.5"
              ></div>
            </div>

            <!-- Content -->
            <div class="pb-4 flex-1 min-w-0">
              <div class="flex flex-col md:flex-row md:items-center md:gap-3 gap-1">
                <p class="text-xs md:text-sm font-medium text-gray-900 break-words">
                  {{ activity.description }}
                </p>
                <app-badge [status]="activity.status"></app-badge>
              </div>
              <p class="text-xs text-gray-500 mt-1">
                {{ formatTimestamp(activity.timestamp) }}
              </p>
            </div>
          </div>
        </cdk-virtual-scroll-viewport>
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
export class ActivityTimelineComponent {
  @Input() activities: Activity[] = [];

  formatTimestamp(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return timestamp;
    }
  }

  trackByActivityId(index: number, activity: Activity): string {
    return activity.id;
  }
}
