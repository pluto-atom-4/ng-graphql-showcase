import { Component, Input, OnInit, ChangeDetectionStrategy, signal, OnDestroy, Output, EventEmitter, inject, Injector, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { computed } from '@angular/core';
import { map, Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CardComponent, ButtonComponent } from './index';
import { BuildStateWorkerService } from '../services/build-state-worker.service';
import { BuildStatusUpdate } from '../api/generated/graphql';

/**
 * BuildProgressCard: Real-time manufacturing workflow status display
 *
 * Combines daisyUI UI + GraphQL subscriptions + Angular signals to display
 * real-time build status with high-frequency update buffering (250ms windows).
 *
 * **Architecture**:
 * - Signals: buildStatus (from toSignal), statusVariant & isComplete (computed)
 * - RxJS: bufferTime(250ms) aggregates rapid subscription updates
 * - GraphQL: BuildStatusUpdate subscription via build-status.service
 * - Types: BuildStatus enum + BuildStatusUpdate (generated/graphql.ts)
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
 * - Generated types: BuildStatus enum, BuildStatusUpdate from schema.graphql
 */
@Component({
  selector: 'app-build-progress-card',
  standalone: true,
  imports: [CommonModule, CardComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-card *ngIf="buildStatus()" [title]="buildName" [description]="buildId">
      <!-- Status badge -->
      <div class="mb-4 flex items-center gap-2">
        <span [class]="statusBadgeClass()">{{ statusLabel() }}</span>
        <span class="text-sm text-gray-500">{{ buildStatus().timestamp | date:'HH:mm:ss' }}</span>
      </div>

      <!-- Status details -->
      <div class="mb-4">
        <details class="collapse collapse-arrow bg-base-200">
          <summary class="collapse-title text-sm font-medium">Status Info</summary>
          <div class="collapse-content">
            <div class="text-xs space-y-1">
              <p><strong>Current:</strong> {{ statusLabel() }}</p>
              <p><strong>Previous:</strong> {{ buildStatus().oldStatus }}</p>
              <p><strong>Updated:</strong> {{ buildStatus().timestamp | date:'medium' }}</p>
            </div>
          </div>
        </details>
      </div>

      <!-- Action buttons -->
      <div class="card-actions gap-2 pt-4 border-t border-base-300">
        <app-button label="Details" variant="primary" size="sm" (trigger)="openDetails()" />
        <app-button label="View Logs" variant="outline" size="sm" (trigger)="viewLogs()" />
        <app-button label="Cancel Build" variant="ghost" size="sm" [disabled]="isComplete()" (trigger)="cancelBuild()" />
        <app-button label="Restart" variant="primary" size="sm" [disabled]="!isComplete()" (trigger)="restartBuild()" />
      </div>
    </app-card>
  `,
})

export class BuildProgressCardComponent implements OnInit, OnDestroy {
  @Input() buildName = 'Build #42';
  @Input() buildId = 'build-uuid-123';
  @Output() buildClicked = new EventEmitter<string>();

  private stateWorker = inject(BuildStateWorkerService);
  private injector = inject(Injector);
  private subscription: Subscription | null = null;

  buildStatus = signal<BuildStatusUpdate>(this.getDefaultUpdate());

  constructor() {}

  ngOnInit(): void {
    if (!this.buildId) {
      console.warn('BuildId not set, skipping subscription');
      return;
    }

    // Subscribe via centralized state worker (unified data source for both Card + Modal)
    this.stateWorker.subscribeToBuild(this.buildId);

    // Watch for Build updates from centralized state
    runInInjectionContext(this.injector, () => {
      this.subscription = this.stateWorker
        .getBuilds$()
        .pipe(
          map((buildMap: any) => {
            const build = buildMap.get(this.buildId);
            if (build) {
              // Convert Build to BuildStatusUpdate format for display
              return {
                buildId: build.id,
                newStatus: build.status,
                oldStatus: build.status,
                timestamp: new Date(build.updatedAt),
              } as BuildStatusUpdate;
            }
            return this.getDefaultUpdate();
          }),
          takeUntilDestroyed()
        )
        .subscribe(
          (update: any) => {
            this.buildStatus.set(update);
          },
          (error: any) => {
            console.warn(`Subscription error for build ${this.buildId}:`, error);
          }
        );
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.stateWorker.unsubscribeBuild(this.buildId);
  }

  private getDefaultUpdate(): BuildStatusUpdate {
    return {
      buildId: this.buildId,
      newStatus: 'PENDING',
      oldStatus: 'PENDING',
      timestamp: new Date()
    };
  }

  statusLabel = computed(() => this.buildStatus().newStatus);

  statusBadgeClass = computed(() => {
    const status = this.buildStatus().newStatus;
    const baseClass = 'badge badge-lg';
    switch (status) {
      case 'RUNNING':
        return `${baseClass} badge-info`;
      case 'COMPLETE':
        return `${baseClass} badge-success`;
      case 'FAILED':
        return `${baseClass} badge-error`;
      default:
        return `${baseClass} badge-warning`;
    }
  });

  statusVariant = computed(() => {
    const status = this.buildStatus().newStatus;
    switch (status) {
      case 'COMPLETE':
        return 'success';
      case 'RUNNING':
        return 'info';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
        return 'error';
      default:
        return 'info';
    }
  });

  isComplete = computed(() => {
    const status = this.buildStatus().newStatus;
    return status === 'COMPLETE' || status === 'FAILED';
  });



  openDetails(): void {
    this.buildClicked.emit(this.buildId);
  }

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
