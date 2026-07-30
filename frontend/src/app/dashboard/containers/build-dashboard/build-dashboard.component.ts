import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

import { BuildService, Metrics, Activity } from '../../services/build.service';
import { TabsComponent, Tab } from '../../components/tabs/tabs.component';
import { MetricsGridComponent } from '../../components/metrics-grid/metrics-grid.component';
import { ActivityTimelineComponent } from '../../components/activity-timeline/activity-timeline.component';

@Component({
  selector: 'app-build-dashboard',
  standalone: true,
  imports: [CommonModule, TabsComponent, MetricsGridComponent, ActivityTimelineComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-gray-600 mt-1">Monitor builds and activities in real-time</p>
      </div>

      <!-- Tabs -->
      <app-tabs
        [tabs]="tabs"
        [activeIndex]="activeTabIndex$ | async"
        (activeIndexChange)="onTabChange($event)"
      >
        <!-- Tab 1: Metrics -->
        <div tab-metrics class="space-y-6">
          <app-metrics-grid
            [metrics]="metrics$ | async"
          ></app-metrics-grid>
        </div>

        <!-- Tab 2: Activities -->
        <div tab-activities class="space-y-6">
          <app-activity-timeline
            [activities]="activities$ | async"
          ></app-activity-timeline>
        </div>
      </app-tabs>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding: 1.5rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BuildDashboardComponent implements OnInit, OnDestroy {
  @Input() buildId?: string;

  activeTabIndex$ = new BehaviorSubject<number>(0);
  metrics$!: Observable<Metrics | null>;
  activities$!: Observable<Activity[]>;

  private destroy$ = new Subject<void>();

  tabs: Tab[] = [
    { id: 'metrics', label: 'Metrics', index: 0 },
    { id: 'activities', label: 'Activities', index: 1 }
  ];

  constructor(private buildService: BuildService) {}

  ngOnInit(): void {
    this.metrics$ = this.buildService.getBuildsMetrics();
    this.activities$ = this.buildId
      ? this.buildService.getBuildActivities(this.buildId, 10)
      : new Observable((observer) => observer.next([]));

    this.activeTabIndex$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Tab change logic if needed
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTabChange(index: number): void {
    this.activeTabIndex$.next(index);
  }
}
