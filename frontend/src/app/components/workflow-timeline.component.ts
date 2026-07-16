import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkflowHistory } from '../api/generated/graphql';

/**
 * Workflow Timeline Component
 * Displays vertical timeline of workflow events
 * OnPush + signal-based reactivity
 */
@Component({
  selector: 'app-workflow-timeline',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="timeline timeline-vertical">
      @for (event of sortedEvents(); track event.id) {
        <div class="flex flex-col items-center mb-4">
          <!-- Timeline marker -->
          <div class="timeline-middle">
            <div [class]="eventIconClass(event.eventType)">
              {{ eventIcon(event.eventType) }}
            </div>
          </div>

          <!-- Timeline content -->
          <div
            [class]="
              event.eventType === 'Failed'
                ? 'timeline-end border-2 border-error rounded-lg p-3 bg-error/10'
                : 'timeline-end border-2 border-neutral/20 rounded-lg p-3 bg-base-100'
            "
          >
            <time class="text-xs font-mono">
              {{ event.recordedAt | date: 'HH:mm:ss.SSS' }}
            </time>
            <div class="font-bold">{{ event.eventType }}</div>
            <div class="text-sm">{{ event.activityName }}</div>
            <div class="text-xs text-gray-500">
              {{ event.oldStatus }} → {{ event.newStatus }}
            </div>
            @if (event.elapsedMilliseconds) {
              <div class="text-xs">
                Duration: {{ event.elapsedMilliseconds }}ms
              </div>
            }
            @if (event.errorMessage) {
              <div class="text-xs text-error mt-1">
                ⚠️ {{ event.errorMessage }}
              </div>
            }
          </div>

          <!-- Timeline border -->
          <hr />
        </div>
      }
    </div>
  `,
})
export class WorkflowTimelineComponent {
  readonly history = input<WorkflowHistory[]>([]);

  readonly sortedEvents = computed(() => {
    return [...(this.history() || [])].sort(
      (a, b) =>
        new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );
  });

  eventIcon(eventType: string): string {
    switch (eventType) {
      case 'Created':
        return '✨';
      case 'Started':
        return '▶';
      case 'ActivityExecuted':
        return '⚙️';
      case 'Completed':
        return '✓';
      case 'Failed':
      case 'Faulted':
        return '✕';
      case 'Suspended':
        return '⏸';
      default:
        return '•';
    }
  }

  eventIconClass(eventType: string): string {
    const baseClass = 'w-12 h-12 flex items-center justify-center rounded-full';
    switch (eventType) {
      case 'Failed':
      case 'Faulted':
        return `${baseClass} bg-error text-white`;
      case 'Completed':
        return `${baseClass} bg-success text-white`;
      case 'Started':
      case 'ActivityExecuted':
        return `${baseClass} bg-info text-white`;
      default:
        return `${baseClass} bg-neutral text-white`;
    }
  }
}
