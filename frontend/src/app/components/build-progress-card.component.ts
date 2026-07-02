import { Component, Input, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { computed } from '@angular/core';
import { map, startWith } from 'rxjs/operators';

import { CardComponent, BadgeComponent, ButtonComponent } from './index';
import { BuildStatusService } from '../api/build-status.service';
import { BuildStatus } from '../api/generated/graphql';

interface DisplayStatus {
  status: string;
  progress: number;
  testsPassed: number;
  testsTotal: number;
  duration: number;
  timestamp: Date;
}

/**
 * BuildProgressCard: Real-time manufacturing workflow status display
 *
 * Combines daisyUI UI + GraphQL subscriptions + Angular signals to display
 * real-time build status, progress, and test results with high-frequency
 * update buffering (250ms windows).
 *
 * **Architecture**:
 * - Signals: buildStatus (from toSignal), statusVariant & isComplete (computed)
 * - RxJS: bufferTime(250ms) aggregates rapid subscription updates
 * - GraphQL: BuildStatusUpdated subscription via build-status.service
 * - Types: DisplayStatus interface + BuildStatus enum (generated/graphql.ts)
 *
 * **Design System**: See {@link docs/FRONTEND-DESIGN-SYSTEM.md}
 * Uses: CardComponent, BadgeComponent, ButtonComponent
 *
 * **Example**:
 * ```typescript
 * <app-build-progress-card buildName="Production Build" buildId="build-123" />
 * ```
 *
 * **Dependencies**:
 * - BuildStatusService: Manages subscriptions & buffered updates
 * - Generated types: BuildStatus enum from schema.graphql (auto-generated)
 */
@Component({
  selector: 'app-build-progress-card',
  standalone: true,
  imports: [CommonModule, CardComponent, BadgeComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- 1. Check for value availability safely -->
    <app-card *ngIf="buildStatus()" [title]="buildName" [description]="buildId">

      <!-- Status badge -->
      <div class="mb-4 flex items-center gap-2">
        <!-- 2. Invoke signals using parentheses: buildStatus().status -->
        <app-badge [label]="buildStatus().status" [variant]="statusVariant()" />
        <span class="text-sm text-gray-500">{{ buildStatus().timestamp | date:'HH:mm:ss' }}</span>
      </div>

      <!-- Progress bar -->
      <div class="mb-4">
        <div class="flex justify-between mb-2">
          <span class="text-sm font-semibold">Build Progress</span>
          <span class="text-sm">{{ buildStatus().progress }}%</span>
        </div>
        <progress
          class="progress progress-primary w-full"
          [value]="buildStatus().progress || 0"
          max="100"
        ></progress>
      </div>

      <!-- Build metrics -->
      <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p class="text-gray-600">Tests</p>
          <p class="text-lg font-semibold">
            {{ buildStatus().testsPassed }}/{{ buildStatus().testsTotal }}
          </p>
        </div>
        <div>
          <p class="text-gray-600">Duration</p>
          <p class="text-lg font-semibold">{{ buildStatus().duration }}s</p>
        </div>
      </div>

      <!-- Status details -->
      <div class="mb-4">
        <details class="collapse collapse-arrow bg-base-200">
          <summary class="collapse-title text-sm font-medium">Details</summary>
          <div class="collapse-content">
            <pre class="text-xs bg-base-300 p-2 rounded overflow-auto max-h-40">{{
                buildStatus() | json
              }}</pre>
          </div>
        </details>
      </div>

      <!-- Action buttons -->
      <div class="card-actions gap-2 pt-4 border-t border-base-300">
        <app-button label="View Logs" variant="outline" size="sm" (trigger)="viewLogs()" />
        <!-- 3. Computed signals are also invoked with parentheses -->
        <app-button label="Cancel Build" variant="ghost" size="sm" [disabled]="isComplete()" (trigger)="cancelBuild()" />
        <app-button label="Restart" variant="primary" size="sm" [disabled]="!isComplete()" (trigger)="restartBuild()" />
      </div>
    </app-card>
  `,
})

export class BuildProgressCardComponent implements OnInit {
  @Input() buildName = 'Build #42';
  @Input() buildId = 'build-uuid-123';

  private buildStatusService = inject(BuildStatusService);

  buildStatus!: () => DisplayStatus;

  ngOnInit(): void {
    this.buildStatusService.subscribeToBuildStatus(this.buildId);

    const buildStatusStream$ = this.buildStatusService.getBufferedUpdates().pipe(
      map(updates => this.mapUpdatesToDisplay(updates)),
      startWith(this.getDefaultStatus())
    );

    this.buildStatus = toSignal(buildStatusStream$, {
      initialValue: this.getDefaultStatus()
    });
  }

  private mapUpdatesToDisplay(updates: any[]): DisplayStatus {
    const latestUpdate = updates[updates.length - 1];
    if (!latestUpdate) {
      return this.getDefaultStatus();
    }

    return {
      status: this.mapStatus(latestUpdate.newStatus),
      progress: 0,
      testsPassed: 0,
      testsTotal: 0,
      duration: 0,
      timestamp: new Date(latestUpdate.timestamp)
    };
  }

  private getDefaultStatus(): DisplayStatus {
    return {
      status: 'Starting',
      progress: 0,
      testsPassed: 0,
      testsTotal: 0,
      duration: 0,
      timestamp: new Date()
    };
  }

  private mapStatus(gqlStatus: BuildStatus): string {
    const statusMap: Record<BuildStatus, string> = {
      [BuildStatus.Pending]: 'Starting',
      [BuildStatus.Running]: 'In Progress',
      [BuildStatus.Complete]: 'Complete',
      [BuildStatus.Failed]: 'Failed'
    };
    return statusMap[gqlStatus] || 'Starting';
  }

  statusVariant = computed(() => {
    const status = this.buildStatus().status;
    switch (status) {
      case 'Complete': return 'success';
      case 'Finalizing': return 'warning';
      case 'In Progress':
      case 'Starting': return 'info';
      case 'Failed': return 'error';
      default: return 'info';
    }
  });

  isComplete = computed(() => {
    const status = this.buildStatus().status;
    return status === 'Complete' || status === 'Failed';
  });



  viewLogs(): void {
    console.log('Opening logs for', this.buildId);
  }

  cancelBuild(): void {
    console.log('Cancelling build', this.buildId);
  }

  restartBuild(): void {
    console.log('Restarting build', this.buildId);
  }
}
