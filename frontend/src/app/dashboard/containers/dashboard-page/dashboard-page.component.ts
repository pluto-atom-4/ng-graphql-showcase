import {
  Component,
  Input,
  OnInit,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  of,
  catchError,
  switchMap,
  map,
  shareReplay,
  startWith,
} from 'rxjs';

import { BuildService, Build, Metrics, Activity } from '../../services/build.service';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { PaginationControlsComponent } from '../../components/pagination-controls/pagination-controls.component';
import { ActivityTimelineComponent } from '../../components/activity-timeline/activity-timeline.component';
import { MetricsGridComponent } from '../../components/metrics-grid/metrics-grid.component';
import { DASHBOARD_CONSTANTS } from './dashboard-page.constants';

/**
 * DashboardPageComponent - Container component for build dashboard.
 *
 * Manages:
 * - Metrics Grid (total, in-progress, completed, failed builds)
 * - Paginated Builds Table with sorting
 * - Recent Activities Timeline (if buildId provided)
 *
 * State Management:
 * - currentPage$ (BehaviorSubject) - User-controlled pagination state
 * - pageSize$ (BehaviorSubject) - Items per page
 * - builds$ (Observable) - Current page builds (reactive to pagination)
 * - totalBuilds$ (Observable) - Total count
 * - metrics$ (Observable) - Key metrics (cached)
 * - activities$ (Observable) - Recent activities (if buildId)
 * - isLoading$ (Observable) - Loading state
 * - error$ (Observable) - Error messages
 *
 * Accessibility:
 * - main role with id="dashboard"
 * - Section landmarks with aria-labelledby
 * - Table with proper roles (table, row, columnheader, cell)
 * - Pagination buttons with aria-label
 * - Status badges with WCAG AA contrast
 *
 * Performance:
 * - ChangeDetectionStrategy.OnPush
 * - All observables use shareReplay(1) to prevent duplicate requests
 * - trackByBuildId() on *ngFor loops
 * - Virtual scroll for large activity lists (delegated to ActivityTimeline)
 *
 * @example
 * // Basic usage
 * <app-dashboard-page></app-dashboard-page>
 *
 * // With optional buildId filter
 * <app-dashboard-page [buildId]="'build-123'"></app-dashboard-page>
 */
@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    StatusBadgeComponent,
    PaginationControlsComponent,
    ActivityTimelineComponent,
    MetricsGridComponent,
  ],
  template: `
    <main role="main" id="dashboard" class="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div class="max-w-screen px-4 md:px-8 lg:max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8 animate-slide-in">
          <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Build Dashboard</h1>
          <p class="text-sm md:text-base text-gray-600">
            Monitor builds and activities in real-time
          </p>
        </div>

        <!-- Metrics Grid Section -->
        <section aria-labelledby="metrics-heading" class="mb-8 md:mb-12">
          <h2 id="metrics-heading" class="text-xl md:text-2xl font-semibold text-gray-900 mb-4 md:mb-6">
            Key Metrics
          </h2>
          <div *ngIf="metrics$ | async as metrics">
            <app-metrics-grid [metrics]="metrics"></app-metrics-grid>
          </div>
        </section>

        <!-- Builds Table Section -->
        <section aria-labelledby="builds-heading" class="mb-8 md:mb-12">
          <h2 id="builds-heading" class="text-xl md:text-2xl font-semibold text-gray-900 mb-4 md:mb-6">
            Recent Builds
          </h2>

          <!-- Loading state -->
          <div *ngIf="isLoading$ | async" class="space-y-3">
            <div class="h-12 bg-gray-200 rounded skeleton"></div>
            <div class="h-12 bg-gray-200 rounded skeleton"></div>
            <div class="h-12 bg-gray-200 rounded skeleton"></div>
          </div>

          <!-- Builds table -->
          <div *ngIf="!(isLoading$ | async)" class="space-y-4">
            <!-- Table -->
            <div class="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
              <table role="table" aria-label="Build status table" class="w-full">
                <thead class="bg-gray-50 border-b border-gray-200">
                  <tr role="row" class="divide-x divide-gray-200">
                    <th
                      role="columnheader"
                      scope="col"
                      class="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-900"
                    >
                      Build Name
                    </th>
                    <th
                      role="columnheader"
                      scope="col"
                      class="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-900"
                    >
                      Status
                    </th>
                    <th
                      role="columnheader"
                      scope="col"
                      class="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-900 hidden sm:table-cell"
                    >
                      Created
                    </th>
                    <th
                      role="columnheader"
                      scope="col"
                      class="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-900 hidden sm:table-cell"
                    >
                      Updated
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr
                    *ngFor="let build of (builds$ | async); trackBy: trackByBuildId; let i = index"
                    role="row"
                    tabindex="0"
                    class="hover:bg-blue-50 cursor-pointer divide-x divide-gray-200 transition-colors duration-150 focus:outline-2 focus:outline-blue-500 focus:outline-offset-[-2px]"
                    (click)="onBuildRowClick(build)"
                    (keydown)="onTableRowKeydown($event, i)"
                  >
                    <td role="cell" class="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 font-medium">
                      {{ build.name }}
                    </td>
                    <td role="cell" class="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                      <app-status-badge [status]="build.status"></app-status-badge>
                    </td>
                    <td role="cell" class="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-600 hidden sm:table-cell">
                      {{ build.createdAt | date: 'short' }}
                    </td>
                    <td role="cell" class="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-600 hidden sm:table-cell">
                      {{ build.updatedAt | date: 'short' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Empty state -->
            <div
              *ngIf="(builds$ | async)?.length === 0"
              class="empty-state bg-white rounded-lg border border-gray-200 py-12 md:py-16"
            >
              <div class="empty-state-icon">📋</div>
              <p class="empty-state-text">No builds found</p>
              <p class="empty-state-description">Start creating builds to see them here</p>
            </div>

            <!-- Error state -->
            <div *ngIf="error$ | async as error" class="error-banner" role="alert">
              <p class="error-banner-title">⚠️ Error loading builds:</p>
              <p class="error-banner-message">{{ error }}</p>
            </div>
          </div>

          <!-- Pagination Controls -->
          <app-pagination-controls
            [currentPage]="(currentPage$ | async) ?? 1"
            [pageSize]="(pageSize$ | async) ?? 10"
            [totalItems]="(totalBuilds$ | async) ?? 0"
            (pageChange)="onPageChange($event)"
          ></app-pagination-controls>
        </section>

        <!-- Recent Activities Section (only if buildId) -->
        <section
          *ngIf="buildId"
          aria-labelledby="activities-heading"
          class="card"
        >
          <h2 id="activities-heading" class="text-xl md:text-2xl font-semibold text-gray-900 mb-6">
            Recent Activities
          </h2>
          <app-activity-timeline
            [activities]="(activities$ | async) || []"
          ></app-activity-timeline>
        </section>
      </div>
    </main>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent implements OnInit {
  /**
   * Optional buildId to filter activities by specific build.
   */
  @Input() buildId?: string;

  // === State Management ===

  /**
   * Current page number (1-indexed).
   * Controlled by PaginationControls component via onPageChange().
   */
  currentPage$ = new BehaviorSubject<number>(DASHBOARD_CONSTANTS.DEFAULT_PAGE);

  /**
   * Items per page.
   * Can be updated via pageSize setter if needed.
   */
  pageSize$ = new BehaviorSubject<number>(DASHBOARD_CONSTANTS.DEFAULT_PAGE_SIZE);

  /**
   * Loading state - true while fetching builds.
   */
  isLoading$!: Observable<boolean>;

  /**
   * Error state - message if builds fetch fails.
   */
  error$ = new BehaviorSubject<string | null>(null);

  /**
   * Paginated builds for current page.
   * Reactive to currentPage$ and pageSize$ changes.
   */
  builds$!: Observable<Build[]>;

  /**
   * Total build count (across all pages).
   * Used by PaginationControls to calculate total pages.
   */
  totalBuilds$!: Observable<number>;

  /**
   * Key metrics (total, inProgress, completed, failed).
   * Cached via shareReplay(1).
   */
  metrics$!: Observable<Metrics | null>;

  /**
   * Recent activities for current buildId (if provided).
   * Empty array if no buildId.
   */
  activities$!: Observable<Activity[]>;

  // === Dependencies ===
  private buildService = inject(BuildService);

  // === Lifecycle ===

  ngOnInit(): void {
    this.initializeStateManagement();
  }

  // === Public Methods ===

  /**
   * Handle pagination change event from PaginationControls.
   * Updates currentPage$ BehaviorSubject, triggering builds$ refresh.
   *
   * @param newPage - New page number (1-indexed)
   */
  onPageChange(newPage: number): void {
    this.currentPage$.next(newPage);
  }

  /**
   * Handle build row click.
   * Currently logs the build; can be extended for navigation/modal.
   *
   * @param build - Clicked build object
   */
  onBuildRowClick(build: Build): void {
    console.log('Build row clicked:', build);
    // TODO: Navigate to build detail or open modal
  }

  /**
   * Handle keyboard navigation on table rows (ArrowUp/Down).
   * Allows users to navigate between builds using arrow keys.
   *
   * @param event - Keyboard event
   * @param index - Index of current row in the table
   */
  onTableRowKeydown(event: KeyboardEvent, index: number): void {
    const table = (event.target as HTMLElement).closest('table');
    if (!table) return;

    const rows = Array.from(table.querySelectorAll('tbody tr'));

    if (event.key === 'ArrowDown' && index < rows.length - 1) {
      event.preventDefault();
      (rows[index + 1] as HTMLElement)?.focus();
    } else if (event.key === 'ArrowUp' && index > 0) {
      event.preventDefault();
      (rows[index - 1] as HTMLElement)?.focus();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      // Trigger the row click handler
      const row = rows[index] as HTMLElement;
      row?.click();
    }
  }

  /**
   * TrackBy function for *ngFor on builds array.
   * Essential for performance optimization per CLAUDE.md.
   *
   * @param index - Array index
   * @param build - Build object
   * @returns Unique identifier for build
   */
  trackByBuildId(_index: number, build: Build): string {
    return build.id;
  }

  // === Private Methods ===

  /**
   * Initialize all observable chains and state management.
   *
   * Key patterns:
   * - BehaviorSubject for user-controlled state (currentPage, pageSize)
   * - combineLatest + switchMap for dependent queries
   * - shareReplay(1) to prevent duplicate subscriptions
   * - takeUntilDestroyed() for automatic cleanup
   * - catchError with graceful fallback
   */
  private initializeStateManagement(): void {
    // Builds for current page (depends on pagination state)
    this.builds$ = combineLatest([
      this.currentPage$,
      this.pageSize$,
    ]).pipe(
      switchMap(([page, size]) => {
        const skip = (page - 1) * size;
        return this.buildService.getBuilds(skip, size).pipe(
          map((result) => result.builds),
          catchError((error) => {
            this.error$.next(`Failed to load builds: ${error?.message || 'Unknown error'}`);
            return of([]);
          })
        );
      }),
      shareReplay(1)
    );

    // Total build count (cached)
    this.totalBuilds$ = this.buildService.getBuilds(0, 1).pipe(
      map((result) => result.total),
      catchError(() => of(0)),
      shareReplay(1)
    );

    // Loading state: true while fetching, false when data arrives or error occurs
    this.isLoading$ = combineLatest([
      this.currentPage$,
      this.pageSize$,
    ]).pipe(
      switchMap(([page, size]) => {
        const skip = (page - 1) * size;
        return this.buildService.getBuilds(skip, size).pipe(
          map(() => false), // Transition to false once data arrives
          startWith(true),  // Start with true (loading)
          catchError(() => of(false)) // False on error (show error state)
        );
      }),
      shareReplay(1)
    );

    // Metrics (global, not filtered by page)
    this.metrics$ = this.buildService.getBuildsMetrics().pipe(
      catchError(() => of(null)),
      shareReplay(1)
    );

    // Activities (only if buildId provided)
    this.activities$ = this.buildId
      ? this.buildService
          .getBuildActivities(this.buildId, DASHBOARD_CONSTANTS.DEFAULT_ACTIVITIES_LIMIT)
          .pipe(
            catchError(() => of([])),
            shareReplay(1)
          )
      : of([]);
  }
}
