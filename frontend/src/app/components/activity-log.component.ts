import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkflowActivity } from '../api/generated/graphql';

type SortField = 'name' | 'status' | 'durationMs' | 'startTime';
type SortOrder = 'asc' | 'desc';

/**
 * Activity Log Component
 * Table of workflow activities with sorting and filtering
 * OnPush + signal-based reactivity
 */
@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <!-- Filters -->
      <div class="flex gap-2">
        <input
          type="text"
          placeholder="Filter by name..."
          class="input input-bordered input-sm flex-1"
          [(ngModel)]="filterText"
        />
        <select
          class="select select-bordered select-sm"
          [(ngModel)]="filterStatus"
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Running">Running</option>
          <option value="Completed">Completed</option>
          <option value="Faulted">Faulted</option>
        </select>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="table table-sm">
          <thead>
            <tr>
              <th (click)="toggleSort('name')" class="cursor-pointer">
                Name {{ sortIcon('name') }}
              </th>
              <th (click)="toggleSort('status')" class="cursor-pointer">
                Status {{ sortIcon('status') }}
              </th>
              <th (click)="toggleSort('startTime')" class="cursor-pointer">
                Start Time {{ sortIcon('startTime') }}
              </th>
              <th (click)="toggleSort('durationMs')" class="cursor-pointer">
                Duration (ms) {{ sortIcon('durationMs') }}
              </th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            @for (activity of filteredActivities(); track activity.name) {
              <tr
                [class]="
                  activity.status === 'Faulted'
                    ? 'bg-error/10 hover:bg-error/20'
                    : ''
                "
              >
                <td class="font-mono text-sm">{{ activity.name }}</td>
                <td>
                  <span [class]="statusBadgeClass(activity.status)">
                    {{ activity.status }}
                  </span>
                </td>
                <td class="text-xs">
                  {{ activity.startTime | date: 'HH:mm:ss.SSS' }}
                </td>
                <td class="text-right">
                  {{ activity.durationMs || '—' }}
                </td>
                <td class="text-xs">
                  @if (activity.errorMessage) {
                    <span class="text-error" title="{{ activity.errorMessage }}">
                      ⚠️
                    </span>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="text-center text-gray-500">
                  No activities match filter
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Summary -->
      <div class="text-xs text-gray-500">
        Showing {{ filteredActivities().length }} of
        {{ activities().length }} activities
      </div>
    </div>
  `,
})
export class ActivityLogComponent {
  readonly activities = input<WorkflowActivity[]>([]);

  readonly sortField = signal<SortField>('startTime');
  readonly sortOrder = signal<SortOrder>('asc');
  readonly filterText = signal('');
  readonly filterStatus = signal('');

  readonly filteredActivities = computed(() => {
    let filtered = [...(this.activities() || [])];

    // Text filter
    const text = this.filterText().toLowerCase();
    if (text) {
      filtered = filtered.filter((a) => a.name.toLowerCase().includes(text));
    }

    // Status filter
    const status = this.filterStatus();
    if (status) {
      filtered = filtered.filter((a) => a.status === status);
    }

    // Sort
    const field = this.sortField();
    const order = this.sortOrder();
    filtered.sort((a, b) => {
      let aVal: any = a[field];
      let bVal: any = b[field];

      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return order === 'asc' ? comparison : -comparison;
    });

    return filtered;
  });

  statusBadgeClass(status: string): string {
    const baseClass = 'badge badge-sm';
    switch (status) {
      case 'Pending':
        return `${baseClass} badge-neutral`;
      case 'Running':
        return `${baseClass} badge-info`;
      case 'Completed':
        return `${baseClass} badge-success`;
      case 'Faulted':
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
