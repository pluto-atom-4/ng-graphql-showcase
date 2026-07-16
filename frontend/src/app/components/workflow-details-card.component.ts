import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkflowInstance } from '../api/generated/graphql';
import { WorkflowService } from '../api/workflow.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Workflow Details Card - MVP Summary Display
 * Shows: workflow ID, build ID, status, duration, mini timeline
 * OnPush + signals for reactive updates
 */
@Component({
  selector: 'app-workflow-details-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title text-lg">
          Workflow {{ workflow()?.id | slice: 0:8 }}
        </h2>

        <div class="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span class="font-semibold">Status:</span>
            <span [class]="statusBadgeClass()">{{ workflow()?.status }}</span>
          </div>
          <div>
            <span class="font-semibold">Build:</span>
            <span>{{ workflow()?.buildId || 'N/A' }}</span>
          </div>
          <div>
            <span class="font-semibold">Started:</span>
            <span>{{ workflow()?.startedAt | date: 'HH:mm:ss' }}</span>
          </div>
          <div>
            <span class="font-semibold">Duration:</span>
            <span>{{ duration() }}ms</span>
          </div>
        </div>

        <!-- Mini Timeline (last 3 events) -->
        <div class="mt-4">
          <h3 class="text-sm font-semibold mb-2">Recent Events</h3>
          <div class="space-y-1">
            @for (
              event of workflow()?.history?.slice(0, 3);
              track event.id
            ) {
              <div class="text-xs flex justify-between">
                <span>{{ event.eventType }}</span>
                <span class="text-gray-500">
                  {{ event.recordedAt | date: 'HH:mm:ss' }}
                </span>
              </div>
            }
          </div>
        </div>

        <div class="card-actions justify-end mt-4">
          <button class="btn btn-sm btn-primary">View Details</button>
        </div>
      </div>
    </div>
  `,
})
export class WorkflowDetailsCardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  readonly workflow = input<WorkflowInstance | null>(null);

  readonly statusBadgeClass = computed(() => {
    const status = this.workflow()?.status;
    const baseClass = 'badge badge-sm';
    switch (status) {
      case 'Running':
        return `${baseClass} badge-info`;
      case 'Completed':
        return `${baseClass} badge-success`;
      case 'Faulted':
        return `${baseClass} badge-error`;
      default:
        return `${baseClass} badge-neutral`;
    }
  });

  readonly duration = computed(() => {
    const workflow = this.workflow();
    if (!workflow?.startedAt || !workflow?.completedAt) return 0;
    return Math.abs(
      new Date(workflow.completedAt).getTime() -
        new Date(workflow.startedAt).getTime()
    );
  });

  constructor(private workflowService: WorkflowService) {}

  ngOnInit(): void {
    // Optional: Subscribe to real-time updates if workflowId available
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
