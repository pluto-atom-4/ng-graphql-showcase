import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkflowService } from '../api/workflow.service';
import { WorkflowHistory } from '../api/generated/graphql';

@Component({
  selector: 'app-workflow-details-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card bg-gray-50 shadow">
      <div class="card-body">
        <h2 class="card-title text-lg">Workflow History</h2>

        <div class="text-sm space-y-2">
          <div>
            <span class="font-semibold">Total Events:</span>
            <span>{{ events().length }}</span>
          </div>
          <div>
            <span class="font-semibold">Build ID:</span>
            <span class="font-mono">{{ buildId() | slice: 0:8 }}</span>
          </div>
        </div>

        <div class="mt-4">
          <h3 class="text-sm font-semibold mb-2">Recent Events</h3>
          <div class="space-y-1">
            @for (event of events().slice(0, 3); track event.id) {
              <div class="text-xs flex justify-between">
                <span>{{ event.eventType }}</span>
                <span class="text-gray-500">
                  {{ event.recordedAt | date: 'HH:mm:ss' }}
                </span>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class WorkflowDetailsCardComponent {
  readonly buildId = input.required<string>();
  readonly events = signal<WorkflowHistory[]>([]);

  constructor(private workflowService: WorkflowService) {
    effect(
      () => {
        const bid = this.buildId();
        if (!bid) return;
        const sub = this.workflowService
          .getWorkflowsByBuild(bid)
          .subscribe((events) => this.events.set(events));
        return () => sub.unsubscribe();
      },
      { allowSignalWrites: true }
    );
  }
}
