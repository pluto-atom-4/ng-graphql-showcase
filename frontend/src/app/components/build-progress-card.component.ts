import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop'; // Required import
import { computed } from '@angular/core'; // Required import
import { interval, Observable } from 'rxjs';
import { map, bufferTime, startWith } from 'rxjs/operators';

import { CardComponent, BadgeComponent, ButtonComponent } from './index';

/**
 * BuildProgressCard: Complete daisyUI + GraphQL + RxJS Integration Example
 *
 * This component demonstrates:
 * 1. daisyUI semantic classes (card, progress, badge, btn)
 * 2. Angular Signals and type-safe inputs
 * 3. RxJS subscriptions with high-frequency buffering
 * 4. Real-time status updates (simulated GraphQL subscription)
 *
 * In production, replace mockBuildProgress$ with:
 *   this.buildService.buildSubscription(buildId).pipe(...)
 */
@Component({
  selector: 'app-build-progress-card',
  standalone: true,
  imports: [CommonModule, CardComponent, BadgeComponent, ButtonComponent],
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

  // 4. Declare a readonly Signal instead of an Observable
  buildStatus!: () => BuildStatus;

  ngOnInit(): void {
    const rawStream$ = this.mockBuildProgress$().pipe(
      bufferTime(250),
      map(statuses => statuses[statuses.length - 1] || {
        status: 'idle', progress: 0, testsPassed: 0,
        testsTotal: 0, duration: 0, timestamp: new Date()
      })
    );

    // 5. Convert the stream to a Signal.
    // We pass an initial value so the template has data immediately.
    this.buildStatus = toSignal(rawStream$, {
      initialValue: {
        status: 'Starting',
        progress: 0,
        testsPassed: 0,
        testsTotal: 150,
        duration: 0,
        timestamp: new Date()
      }
    });
  }

  // 6. Use 'computed' signals for derived state.
  // These automatically recalculate whenever buildStatus updates.
  statusVariant = computed(() => {
    const status = this.buildStatus().status;
    switch (status) {
      case 'Complete': return 'success';
      case 'Finalizing': return 'warning';
      case 'In Progress':
      case 'Starting': return 'info';
      case 'Failed':
      case 'Cancelled': return 'error';
      default: return 'info';
    }
  });

  isComplete = computed(() => {
    const status = this.buildStatus().status;
    return status === 'Complete' || status === 'Failed' || status === 'Cancelled';
  });


  /**
   * Mock GraphQL subscription emitting build status updates
   * In production, replace with real GraphQL subscription:
   *
   * private buildService.buildSubscription(buildId: string) {
   *   return this.apollo.subscribe<BuildStatusUpdate>({
   *     query: BUILD_STATUS_SUBSCRIPTION,
   *     variables: { buildId }
   *   }).pipe(
   *     map(result => result.data.buildStatus),
   *     bufferTime(250)
   *   );
   * }
   */
  private mockBuildProgress$(): Observable<BuildStatus> {
    return interval(100).pipe(
      map(tick => {
        const progress = Math.min(tick * 5, 100);
        const testsPassed = Math.floor(progress * 1.5);
        const testsTotal = 150;

        // Fixed: Explicit type forces TypeScript to see literal values instead of 'string'
        const status: BuildStatus['status'] = progress < 50 ? 'In Progress' : progress < 100 ? 'Finalizing' : 'Complete';

        return {
          status,
          progress,
          testsPassed: Math.min(testsPassed, testsTotal),
          testsTotal,
          duration: tick,
          timestamp: new Date(),
        };
      }),
      // Fixed: Explicit type prevents type-widening inside the operator
      startWith({
        status: 'Starting' as const, // or 'Starting' as BuildStatus['status']
        progress: 0,
        testsPassed: 0,
        testsTotal: 150,
        duration: 0,
        timestamp: new Date(),
      })
    );
  }

  viewLogs(): void {
    console.log('Opening logs for', this.buildId);
  }

  cancelBuild(): void {
    console.log('Cancelling build', this.buildId);
    // In production: this.buildService.cancelBuild(this.buildId).subscribe(...)
  }

  restartBuild(): void {
    console.log('Restarting build', this.buildId);
    // In production: this.buildService.restartBuild(this.buildId).subscribe(...)
  }
}

/**
 * Type-safe GraphQL subscription response
 * Maps to BuildStatus from backend GraphQL schema
 */
interface BuildStatus {
  status: 'Starting' | 'In Progress' | 'Finalizing' | 'Complete' | 'Failed' | 'Cancelled';
  progress: number; // 0-100
  testsPassed: number;
  testsTotal: number;
  duration: number; // seconds
  timestamp: Date;
}
