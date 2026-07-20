import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkflowHistory } from '../api/generated/graphql';

type SortField = 'activityName' | 'newStatus' | 'elapsedMilliseconds' | 'recordedAt';
type SortOrder = 'asc' | 'desc';

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div class="overflow-x-auto">
        <table class="table table-sm">
          <thead>
            <tr>
              <th (click)="toggleSort('activityName')" class="cursor-pointer">
                Activity {{ sortIcon('activityName') }}
              </th>
              <th (click)="toggleSort('newStatus')" class="cursor-pointer">
                Status {{ sortIcon('newStatus') }}
              </th>
              <th (click)="toggleSort('recordedAt')" class="cursor-pointer">
                Recorded {{ sortIcon('recordedAt') }}
              </th>
              <th (click)="toggleSort('elapsedMilliseconds')" class="cursor-pointer">
                Duration (ms) {{ sortIcon('elapsedMilliseconds') }}
              </th>
              <th>Event Type</th>
            </tr>
          </thead>
          <tbody>
            @for (event of activities(); track event.id) {
              <tr
                [class]="
                  event.eventType === 'Failed'
                    ? 'bg-error/10 hover:bg-error/20'
                    : ''
                "
              >
                <td class="font-mono text-sm">{{ event.activityName }}</td>
                <td>
                  <span [class]="statusBadgeClass(event.newStatus)">
                    {{ event.newStatus }}
                  </span>
                </td>
                <td class="text-xs">
                  {{ event.recordedAt | date: 'HH:mm:ss.SSS' }}
                </td>
                <td class="text-right">
                  {{ event.elapsedMilliseconds || '—' }}
                </td>
                <td class="text-xs">{{ event.eventType }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="text-center text-gray-500">
                  No events recorded
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="text-xs text-gray-500">
        Showing {{ activities().length }} events
      </div>
    </div>
  `,
})
export class ActivityLogComponent {
  readonly activities = input<WorkflowHistory[]>([]);

  readonly sortField = signal<SortField>('recordedAt');
  readonly sortOrder = signal<SortOrder>('desc');

  statusBadgeClass(status: string | null): string {
    const baseClass = 'badge badge-sm';
    switch (status) {
      case 'Pending':
        return `${baseClass} badge-neutral`;
      case 'Running':
        return `${baseClass} badge-info`;
      case 'Completed':
        return `${baseClass} badge-success`;
      case 'Failed':
        return `${baseClass} badge-error`;
      default:
        return baseClass;
    }
  }

  sortIcon(field: SortField): string {
    if (this.sortField() !== field) return '—';
    return this.sortOrder() === 'asc' ? '▲' : '▼';
  }

  toggleSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortOrder.update((order) => (order === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortField.set(field);
      this.sortOrder.set('asc');
    }
  }
}
