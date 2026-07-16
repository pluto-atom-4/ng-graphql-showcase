import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed,
  OnInit,
  OnDestroy,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkflowService } from '../api/workflow.service';
import { WorkflowTimelineComponent } from './workflow-timeline.component';
import { ActivityLogComponent } from './activity-log.component';
import { WorkflowInstance } from '../api/generated/graphql';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

type Tab = 'timeline' | 'activities' | 'json';

/**
 * Workflow History Viewer Component
 * Main container for workflow visualization
 * - Tabs: Timeline View | Activity Log | Raw JSON
 * - Real-time subscription updates
 * - Status badge, duration, filters
 * OnPush + signal-based
 */
@Component({
  selector: 'app-workflow-history-viewer',
  standalone: true,
  imports: [
    CommonModule,
    WorkflowTimelineComponent,
    ActivityLogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold">Workflow History</h1>
          <p class="text-sm text-gray-500">
            Build {{ workflow()?.buildId || 'N/A' }} —
            Workflow {{ workflow()?.id | slice: 0:8 }}
          </p>
        </div>
        <div class="flex gap-2 items-center">
          <span [class]="statusBadgeClass()">
            {{ workflow()?.status }}
          </span>
          <span class="text-sm font-semibold">
            Duration: {{ duration() }}ms
          </span>
        </div>
      </div>

      <!-- Filters (optional enhancement) -->
      <div class="flex gap-2">
        <button
          class="btn btn-sm btn-outline"
          (click)="exportJSON()"
          title="Export workflow history as JSON"
        >
          ⬇️ Export JSON
        </button>
        <button
          class="btn btn-sm btn-outline"
          (click)="refreshData()"
          title="Refresh workflow data"
        >
          🔄 Refresh
        </button>
        @if (isSubscribed()) {
          <span class="text-xs text-info flex items-center gap-1">
            🔴 Live
          </span>
        }
      </div>

      <!-- Tab Navigation -->
      <div class="tabs tabs-bordered">
        <button
          [class.tab-active]="activeTab() === 'timeline'"
          class="tab"
          (click)="activeTab.set('timeline')"
        >
          📊 Timeline
        </button>
        <button
          [class.tab-active]="activeTab() === 'activities'"
          class="tab"
          (click)="activeTab.set('activities')"
        >
          ⚙️ Activities ({{ workflow()?.activities?.length || 0 }})
        </button>
        <button
          [class.tab-active]="activeTab() === 'json'"
          class="tab"
          (click)="activeTab.set('json')"
        >
          {{ '{' }}{{ '}' }} Raw JSON
        </button>
      </div>

      <!-- Tab Content -->
      <div class="bg-base-100 rounded-lg p-4">
        @switch (activeTab()) {
          @case ('timeline') {
            <app-workflow-timeline [history]="workflow()?.history || []" />
          }
          @case ('activities') {
            <app-activity-log [activities]="workflow()?.activities || []" />
          }
          @case ('json') {
            <pre class="text-xs overflow-auto max-h-96 whitespace-pre-wrap break-words"><code>{{ jsonString() }}</code></pre>
          }
        }
      </div>

      <!-- Footer -->
      <div class="text-xs text-gray-500 text-center">
        Last updated: {{ lastUpdated() | date: 'HH:mm:ss' }}
      </div>
    </div>
  `,
})
export class WorkflowHistoryViewerComponent
  implements OnInit, OnDestroy
{
  private destroy$ = new Subject<void>();
  private refreshCount = 0;

  readonly workflowId = input.required<string>();
  readonly workflow = signal<WorkflowInstance | null>(null);
  readonly activeTab = signal<Tab>('timeline');
  readonly isSubscribed = signal(false);
  readonly lastUpdated = signal(new Date());

  readonly duration = computed(() => {
    const w = this.workflow();
    if (!w?.startedAt || !w?.completedAt) return 0;
    return Math.abs(
      new Date(w.completedAt).getTime() - new Date(w.startedAt).getTime()
    );
  });

  readonly statusBadgeClass = computed(() => {
    const status = this.workflow()?.status;
    const baseClass = 'badge';
    switch (status) {
      case 'Running':
        return `${baseClass} badge-info badge-lg animate-pulse`;
      case 'Completed':
        return `${baseClass} badge-success badge-lg`;
      case 'Faulted':
        return `${baseClass} badge-error badge-lg`;
      default:
        return `${baseClass} badge-neutral badge-lg`;
    }
  });

  readonly jsonString = computed(() => {
    const workflow = this.workflow();
    return workflow ? JSON.stringify(workflow, null, 2) : '';
  });

  constructor(private workflowService: WorkflowService) {
    // Refresh workflow data when ID changes
    effect(() => {
      const id = this.workflowId();
      if (id) {
        this.loadWorkflow(id);
      }
    });
  }

  ngOnInit(): void {
    // Subscribe to real-time updates if workflow running
    this.subscribeToUpdates();
  }

  private loadWorkflow(workflowId: string): void {
    this.workflowService
      .getWorkflow(workflowId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((workflow) => {
        this.workflow.set(workflow);
        this.lastUpdated.set(new Date());
      });
  }

  private subscribeToUpdates(): void {
    const id = this.workflowId();
    if (!id) return;

    this.workflowService
      .subscribeToWorkflowUpdates(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((updated) => {
        if (updated && this.workflow()) {
          // Merge subscription update with existing workflow (preserve history)
          const current = this.workflow()!;
          this.workflow.set({
            ...current,
            ...updated,
            history: current.history, // Keep existing history
          });
          this.lastUpdated.set(new Date());
          this.isSubscribed.set(true);
        }
      });

    // Also subscribe to history additions
    this.workflowService
      .subscribeToHistoryAdded(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        if (event && this.workflow()) {
          const current = this.workflow()!;
          const updatedHistory = [
            event,
            ...(current.history || []),
          ];
          this.workflow.set({
            ...current,
            history: updatedHistory,
          });
          this.lastUpdated.set(new Date());
        }
      });
  }

  refreshData(): void {
    this.refreshCount++;
    this.loadWorkflow(this.workflowId());
  }

  exportJSON(): void {
    const workflow = this.workflow();
    if (!workflow) return;

    const json = JSON.stringify(workflow, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-${workflow.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  ngOnDestroy(): void {
    const id = this.workflowId();
    if (id) {
      this.workflowService.unsubscribeFromWorkflow(id);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}
