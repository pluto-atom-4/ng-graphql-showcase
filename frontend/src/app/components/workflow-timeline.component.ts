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
    <div class="relative">
      <!-- Timeline connector line -->
      <div class="absolute left-5 top-8 bottom-0 w-0.5 bg-gray-300"></div>

      <!-- Timeline events -->
      <div class="relative space-y-4">
        @for (event of sortedEvents(); track event.id) {
          <div class="flex gap-4">
            <!-- Timeline marker -->
            <div class="flex-shrink-0">
              <div [class]="eventIconClass(event.eventType)">
                {{ eventIcon(event.eventType) }}
              </div>
            </div>

            <!-- Timeline content -->
            <div
              [class]="
                event.eventType === 'Failed'
                  ? 'flex-1 border-2 border-red-400 rounded-lg p-3 bg-red-50'
                  : 'flex-1 border border-gray-200 rounded-lg p-3 bg-gray-50'
              "
            >
              <time class="text-xs font-mono text-gray-600">
                {{ event.recordedAt | date: 'HH:mm:ss.SSS' }}
              </time>
              <div class="font-bold text-gray-900">{{ event.eventType }}</div>
              <div class="text-sm text-gray-700">{{ event.activityName }}</div>
              <div class="text-xs text-gray-500">
                {{ event.oldStatus }} → {{ event.newStatus }}
              </div>
              @if (event.elapsedMilliseconds) {
                <div class="text-xs text-gray-600">
                  Duration: {{ event.elapsedMilliseconds }}ms
                </div>
              }
              @if (event.errorMessage) {
                <div class="text-xs text-red-600 mt-1">
                  ⚠️ {{ event.errorMessage }}
                </div>
              }
            </div>
          </div>
        }
      </div>
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
        return `${baseClass} bg-red-600 text-white`;
      case 'Completed':
        return `${baseClass} bg-green-600 text-white`;
      case 'Started':
      case 'ActivityExecuted':
        return `${baseClass} bg-blue-600 text-white`;
      default:
        return `${baseClass} bg-gray-600 text-white`;
    }
  }
}
