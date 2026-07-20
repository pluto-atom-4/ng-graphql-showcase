import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkflowService } from '../api/workflow.service';
import { ActivityLogComponent } from './activity-log.component';
import { WorkflowHistory } from '../api/generated/graphql';

type Tab = 'events' | 'json';

@Component({
  selector: 'app-workflow-history-viewer',
  standalone: true,
  imports: [CommonModule, ActivityLogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold">Workflow History</h1>
          <p class="text-sm text-gray-500">Build {{ buildId() }}</p>
        </div>
        <div class="flex gap-2">
          <button
            class="btn btn-sm btn-outline"
            (click)="exportJSON()"
            title="Export as JSON"
          >
            ⬇️ Export
          </button>
        </div>
      </div>

      <div class="tabs tabs-bordered">
        <button
          [class.tab-active]="activeTab() === 'events'"
          class="tab"
          (click)="activeTab.set('events')"
        >
          ⚙️ Events ({{ events().length }})
        </button>
        <button
          [class.tab-active]="activeTab() === 'json'"
          class="tab"
          (click)="activeTab.set('json')"
        >
          JSON
        </button>
      </div>

      <div class="bg-base-100 rounded-lg p-4">
        @switch (activeTab()) {
          @case ('events') {
            <app-activity-log [activities]="events()" />
          }
          @case ('json') {
            <pre class="text-xs overflow-auto max-h-96"><code>{{ jsonString() }}</code></pre>
          }
        }
      </div>

      <div class="text-xs text-gray-500">
        Updated: {{ lastUpdated() | date: 'HH:mm:ss' }}
      </div>
    </div>
  `,
})
export class WorkflowHistoryViewerComponent {
  readonly buildId = input.required<string>();
  readonly events = signal<WorkflowHistory[]>([]);
  readonly activeTab = signal<Tab>('events');
  readonly lastUpdated = signal(new Date());

  readonly jsonString = computed(() =>
    JSON.stringify(this.events(), null, 2)
  );

  constructor(private workflowService: WorkflowService) {
    effect(
      () => {
        const bid = this.buildId();
        if (!bid) return;
        const sub = this.workflowService
          .getWorkflowsByBuild(bid)
          .subscribe((events) => {
            this.events.set(events);
            this.lastUpdated.set(new Date());
          });
        return () => sub.unsubscribe();
      },
      { allowSignalWrites: true }
    );
  }

  exportJSON(): void {
    const json = JSON.stringify(this.events(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-history-${this.buildId()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
