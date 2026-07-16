import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Build } from '../api/generated/graphql';
import { WorkflowHistoryViewerComponent } from './workflow-history-viewer.component';
import { Subject } from 'rxjs';

type DetailTab = 'workflow' | 'parts' | 'testRuns';

/**
 * Build Details Modal Component
 * Displays build information with tabs:
 * - Workflow History (via workflow-history-viewer)
 * - Parts (placeholder)
 * - Test Runs (placeholder)
 * OnPush + signal-based
 */
@Component({
  selector: 'app-build-details',
  standalone: true,
  imports: [CommonModule, WorkflowHistoryViewerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal modal-open">
      <div class="modal-box w-11/12 max-w-5xl max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-bold text-lg">
            Build Details: {{ build()?.name }}
          </h3>
          <button
            class="btn btn-sm btn-circle btn-ghost"
            (click)="onClose()"
          >
            ✕
          </button>
        </div>

        <!-- Build Info -->
        <div class="grid grid-cols-4 gap-4 mb-6 p-4 bg-base-200 rounded">
          <div>
            <span class="text-xs font-semibold text-gray-500">ID</span>
            <p class="font-mono text-sm">{{ build()?.id | slice: 0:8 }}</p>
          </div>
          <div>
            <span class="text-xs font-semibold text-gray-500">Status</span>
            <p [class]="statusBadgeClass()">{{ build()?.status }}</p>
          </div>
          <div>
            <span class="text-xs font-semibold text-gray-500">Created</span>
            <p class="text-sm">{{ build()?.createdAt | date: 'short' }}</p>
          </div>
          <div>
            <span class="text-xs font-semibold text-gray-500">Updated</span>
            <p class="text-sm">{{ build()?.updatedAt | date: 'short' }}</p>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs tabs-bordered mb-4">
          <button
            [class.tab-active]="activeTab() === 'workflow'"
            class="tab"
            (click)="activeTab.set('workflow')"
          >
            🔄 Workflow History
          </button>
          <button
            [class.tab-active]="activeTab() === 'parts'"
            class="tab"
            (click)="activeTab.set('parts')"
          >
            📦 Parts ({{ build()?.parts?.length || 0 }})
          </button>
          <button
            [class.tab-active]="activeTab() === 'testRuns'"
            class="tab"
            (click)="activeTab.set('testRuns')"
          >
            🧪 Test Runs ({{ build()?.testRuns?.length || 0 }})
          </button>
        </div>

        <!-- Tab Content -->
        <div class="bg-base-100 rounded-lg p-4 min-h-96">
          @switch (activeTab()) {
            @case ('workflow') {
              @if (build()?.id) {
                <app-workflow-history-viewer [workflowId]="build()!.id" />
              }
            }
            @case ('parts') {
              <div class="space-y-2">
                @if (build()?.parts && build()!.parts.length > 0) {
                  @for (part of build()!.parts; track part.id) {
                    <div class="p-3 bg-base-200 rounded">
                      <div class="font-semibold">{{ part.name }}</div>
                      <div class="text-sm text-gray-500">
                        SKU: {{ part.sku }} | Qty: {{ part.quantity }}
                      </div>
                    </div>
                  }
                } @else {
                  <p class="text-center text-gray-500">No parts in this build</p>
                }
              </div>
            }
            @case ('testRuns') {
              <div class="space-y-2">
                @if (build()?.testRuns && build()!.testRuns.length > 0) {
                  @for (run of build()!.testRuns; track run.id) {
                    <div class="p-3 bg-base-200 rounded">
                      <div class="flex justify-between items-start">
                        <div>
                          <div class="font-semibold">Test Run {{ run.id | slice: 0:8 }}</div>
                          <div class="text-sm text-gray-500">
                            Status: {{ run.status }}
                          </div>
                        </div>
                        <span [class]="testRunStatusClass(run.status)">
                          {{ run.status }}
                        </span>
                      </div>
                      @if (run.result) {
                        <div class="text-xs mt-2 text-gray-600">
                          {{ run.result }}
                        </div>
                      }
                    </div>
                  }
                } @else {
                  <p class="text-center text-gray-500">No test runs yet</p>
                }
              </div>
            }
          }
        </div>

        <!-- Footer -->
        <div class="modal-action mt-6">
          <button class="btn" (click)="onClose()">Close</button>
        </div>
      </div>

      <!-- Modal backdrop -->
      <div class="modal-backdrop" (click)="onClose()"></div>
    </div>
  `,
})
export class BuildDetailsComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  readonly build = input.required<Build>();
  readonly onClose = input.required<() => void>();

  readonly activeTab = signal<DetailTab>('workflow');

  readonly statusBadgeClass = computed(() => {
    const status = this.build()?.status;
    const baseClass = 'badge badge-lg';
    switch (status) {
      case 'RUNNING':
        return `${baseClass} badge-info`;
      case 'COMPLETE':
        return `${baseClass} badge-success`;
      case 'FAILED':
        return `${baseClass} badge-error`;
      default:
        return `${baseClass} badge-neutral`;
    }
  });

  testRunStatusClass(status: string): string {
    const baseClass = 'badge badge-sm';
    switch (status) {
      case 'PASSED':
        return `${baseClass} badge-success`;
      case 'FAILED':
        return `${baseClass} badge-error`;
      case 'RUNNING':
        return `${baseClass} badge-info`;
      default:
        return `${baseClass} badge-neutral`;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
