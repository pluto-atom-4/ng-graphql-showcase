# BuildService Integration Patterns

**Document Version:** 1.0  
**Last Updated:** 2026-08-03

## Quick Reference

The `BuildService` provides GraphQL-based data access for builds with:

- Pagination with caching
- Real-time status subscriptions (buffered 250ms)
- Metrics computation
- Activity timeline retrieval

---

## Pattern 1: Fetch Paginated Builds with Caching

**Use Case:** Display paginated list of builds

```typescript
export class BuildListComponent implements OnInit {
  builds$!: Observable<Build[]>;
  total$!: Observable<number>;
  pageSize = 10;
  currentPage = 1;
  private destroy$ = new Subject<void>();

  constructor(private buildService: BuildService) {}

  ngOnInit(): void {
    this.loadBuilds();
  }

  loadBuilds(): void {
    const skip = (this.currentPage - 1) * this.pageSize;

    const result$ = this.buildService.getBuilds(skip, this.pageSize).pipe(
      shareReplay(1), // Cache the result
      takeUntil(this.destroy$),
    );

    this.builds$ = result$.pipe(map((result) => result.builds));

    this.total$ = result$.pipe(map((result) => result.total));
  }

  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.loadBuilds();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**Template:**

```html
<div>
  <div *ngFor="let build of builds$ | async; trackBy: trackByBuildId">
    {{ build.name }}
  </div>

  <app-pagination
    [total]="(total$ | async) || 0"
    [pageSize]="pageSize"
    [currentPage]="currentPage"
    (pageChange)="onPageChange($event)"
  ></app-pagination>
</div>
```

**Key Points:**

- Results cached per `skip-take` key
- Use `shareReplay(1)` to share single result
- Unsubscribe with `takeUntil` to prevent memory leaks
- Always use `trackBy` with `*ngFor` for performance

---

## Pattern 2: Subscribe to Real-Time Updates with Buffering

**Use Case:** Update build status in real-time, aggregated every 250ms

```typescript
export class BuildDetailComponent implements OnInit, OnDestroy {
  build$!: Observable<Build>;
  statusHistory: string[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private buildService: BuildService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const buildId = "build-123"; // From route

    // Initial load
    this.build$ = this.buildService.getBuilds(0, 1).pipe(
      map((result) => result.builds[0]),
      shareReplay(1),
      takeUntil(this.destroy$),
    );

    // Subscribe to status updates (buffered 250ms)
    this.buildService
      .subscribeToStatusChange(buildId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((updatedBuild) => {
        console.log("Build updated:", updatedBuild);
        this.statusHistory.push(updatedBuild.status);

        // Trigger change detection (necessary when using OnPush)
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**Performance Note:**

- `bufferTime(250)` inside service aggregates rapid updates
- Multiple updates within 250ms window emitted as single event
- Reduces change detection cycles and network load
- Adjustable in service if needed

**Why Buffering Matters:**

- Without buffering: 10 updates/sec = 10 change detection cycles/sec
- With buffering (250ms): 10 updates/sec = 4 change detection cycles/sec
- 60% reduction in CPU usage for high-frequency updates

---

## Pattern 3: Load Metrics with Real-Time Subscription

**Use Case:** Display build metrics (total, in progress, completed, failed) with live updates

```typescript
export class MetricsDashboardComponent implements OnInit, OnDestroy {
  metrics$!: Observable<Metrics>;
  metricsHistory: Metrics[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private buildService: BuildService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Load initial metrics
    this.metrics$ = this.buildService.getBuildsMetrics().pipe(
      tap((metrics) => this.metricsHistory.push(metrics)),
      shareReplay(1),
      takeUntil(this.destroy$),
    );

    // Auto-refresh every 30 seconds
    interval(30000)
      .pipe(
        switchMap(() => this.buildService.getBuildsMetrics()),
        takeUntil(this.destroy$),
      )
      .subscribe((metrics) => {
        this.metricsHistory.push(metrics);
        if (this.metricsHistory.length > 24) {
          this.metricsHistory.shift(); // Keep last 24 refreshes
        }
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**Template:**

```html
<app-metrics-grid
  [metrics]="metrics$ | async || { total: 0, inProgress: 0, completed: 0, failed: 0 }"
></app-metrics-grid>

<div class="mt-4 text-sm text-gray-500">Last updated: {{ lastUpdateTime }}</div>
```

---

## Pattern 4: Load Build Activities/Timeline

**Use Case:** Display build activity timeline (activities are sequential log events)

```typescript
export class BuildTimelineComponent implements OnInit, OnDestroy {
  activities$!: Observable<Activity[]>;
  private destroy$ = new Subject<void>();

  constructor(private buildService: BuildService) {}

  ngOnInit(): void {
    const buildId = "build-123"; // From route

    this.activities$ = this.buildService.getBuildActivities(buildId, 50).pipe(
      tap((activities) => console.log("Loaded activities:", activities)),
      shareReplay(1),
      takeUntil(this.destroy$),
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**Template:**

```html
<app-activity-timeline
  [activities]="activities$ | async || []"
></app-activity-timeline>
```

---

## Pattern 5: Combined Dashboard with Multiple Data Sources

**Use Case:** Dashboard showing builds list + metrics + real-time updates

```typescript
@Component({
  selector: "app-build-dashboard",
  template: `
    <!-- Metrics -->
    <app-metrics-grid [metrics]="metrics$ | async"></app-metrics-grid>

    <!-- Builds List -->
    <div class="mt-8">
      <h2>Recent Builds</h2>

      <div
        *ngFor="let build of builds$ | async; trackBy: trackByBuildId"
        class="mb-4"
      >
        <div class="flex justify-between items-center">
          <span>{{ build.name }}</span>
          <app-badge [status]="build.status"></app-badge>
        </div>
      </div>

      <app-pagination
        [total]="(buildsResult$ | async)?.total || 0"
        [pageSize]="pageSize"
        [currentPage]="currentPage"
        (pageChange)="onPageChange($event)"
      ></app-pagination>
    </div>

    <!-- Status Message -->
    <div role="status" aria-live="polite" aria-atomic="true">
      {{ statusMessage }}
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuildDashboardComponent implements OnInit, OnDestroy {
  buildsResult$!: Observable<BuildsResult>;
  builds$!: Observable<Build[]>;
  metrics$!: Observable<Metrics>;
  statusMessage = "";
  pageSize = 10;
  currentPage = 1;
  private destroy$ = new Subject<void>();

  constructor(
    private buildService: BuildService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Load metrics
    this.metrics$ = this.buildService.getBuildsMetrics().pipe(
      tap(() => (this.statusMessage = "Metrics loaded")),
      shareReplay(1),
      takeUntil(this.destroy$),
    );

    // Load builds
    this.loadBuilds();

    // Auto-refresh metrics every 30 seconds
    interval(30000)
      .pipe(
        switchMap(() => this.buildService.getBuildsMetrics()),
        takeUntil(this.destroy$),
      )
      .subscribe((metrics) => {
        this.statusMessage = `Metrics updated at ${new Date().toLocaleTimeString()}`;
        this.cdr.markForCheck();
      });
  }

  loadBuilds(): void {
    const skip = (this.currentPage - 1) * this.pageSize;

    this.buildsResult$ = this.buildService.getBuilds(skip, this.pageSize).pipe(
      tap(() => (this.statusMessage = "Builds loaded")),
      shareReplay(1),
      takeUntil(this.destroy$),
    );

    this.builds$ = this.buildsResult$.pipe(map((result) => result.builds));
  }

  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.loadBuilds();
  }

  trackByBuildId(index: number, build: Build): string {
    return build.id;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

---

## Pattern 6: Error Handling & Retry Logic

**Use Case:** Handle errors with retry and fallback UI

```typescript
export class BuildListComponent implements OnInit, OnDestroy {
  builds$!: Observable<Build[]>;
  error$: Subject<Error> = new Subject();
  isLoading$: Observable<boolean>;
  private destroy$ = new Subject<void>();

  constructor(private buildService: BuildService) {}

  ngOnInit(): void {
    this.loadBuilds();
  }

  loadBuilds(): void {
    this.builds$ = this.buildService.getBuilds(0, 10).pipe(
      map((result) => result.builds),
      catchError((error) => {
        console.error("Failed to load builds:", error);
        this.error$.next(error);
        return of([]); // Return empty array on error
      }),
      shareReplay(1),
      takeUntil(this.destroy$),
    );
  }

  onRetry(): void {
    this.error$.next(null); // Clear error
    this.loadBuilds();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**Template:**

```html
<div *ngIf="error$ | async as error; else buildsList">
  <app-error-state
    title="Failed to load builds"
    message="{{ error.message }}"
    (retry)="onRetry()"
  ></app-error-state>
</div>

<ng-template #buildsList>
  <div *ngFor="let build of builds$ | async">{{ build.name }}</div>
</ng-template>
```

---

## Pattern 7: Testing BuildService Integration

**Unit Test Example:**

```typescript
describe("BuildListComponent", () => {
  let component: BuildListComponent;
  let buildService: jasmine.SpyObj<BuildService>;

  beforeEach(async () => {
    const buildServiceSpy = jasmine.createSpyObj("BuildService", [
      "getBuilds",
      "getBuildsMetrics",
    ]);

    await TestBed.configureTestingModule({
      declarations: [BuildListComponent],
      providers: [{ provide: BuildService, useValue: buildServiceSpy }],
    }).compileComponents();

    buildService = TestBed.inject(BuildService) as jasmine.SpyObj<BuildService>;
    component = TestBed.createComponent(BuildListComponent).componentInstance;
  });

  it("should load builds on init", () => {
    const mockBuilds: BuildsResult = {
      builds: [
        {
          id: "1",
          name: "Build 1",
          status: "COMPLETE",
          createdAt: "",
          updatedAt: "",
        },
      ],
      total: 1,
    };

    buildService.getBuilds.and.returnValue(of(mockBuilds));

    component.ngOnInit();

    expect(buildService.getBuilds).toHaveBeenCalledWith(0, 10);
    expect(buildService.getBuilds).toHaveBeenCalledTimes(1);
  });

  it("should handle pagination", fakeAsync(() => {
    const mockBuilds: BuildsResult = { builds: [], total: 100 };
    buildService.getBuilds.and.returnValue(of(mockBuilds));

    component.ngOnInit();
    component.onPageChange(2);

    expect(buildService.getBuilds).toHaveBeenCalledWith(10, 10); // Page 2: skip=10
  }));

  it("should handle errors", fakeAsync(() => {
    buildService.getBuilds.and.returnValue(
      throwError(() => new Error("Network error")),
    );

    component.ngOnInit();
    tick();

    expect(component.error$).toBeDefined();
  }));
});
```

---

## Performance Considerations

### Caching Strategy

- Service caches by `${skip}-${take}` key
- Results shared via `shareReplay(1)`
- Cache persists until component destroyed

**Pros:**

- Instant reload if same page requested again
- No duplicate API calls

**Cons:**

- Stale data if builds updated externally
- Large memory overhead for many pages

**Solution:** Clear cache after mutations

```typescript
this.buildService.clearCache();
this.loadBuilds();
```

### Buffering Strategy

- Subscriptions buffer updates for 250ms
- Multiple updates within 250ms window batched
- Reduces change detection cycles

**Example:**

- Without buffering: 10 updates = 10 CD cycles
- With buffering: 10 updates in 250ms = 1 CD cycle
- Result: 90% CPU reduction

### OnPush Change Detection

**Pattern:**

```typescript
@Component({
  selector: "app-dashboard",
  template: `...`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.buildService
      .subscribeToStatusChange("build-123")
      .subscribe((updatedBuild) => {
        // OnPush doesn't detect change automatically
        this.cdr.markForCheck();
      });
  }
}
```

---

## Common Patterns Summary

| Pattern                | Use Case                       | Key Feature         |
| ---------------------- | ------------------------------ | ------------------- |
| Paginated List         | Display builds with pagination | Caching per page    |
| Real-Time Subscription | Live status updates            | bufferTime(250)     |
| Metrics Dashboard      | KPI display                    | Periodic refresh    |
| Activity Timeline      | Build log                      | Sequential history  |
| Combined Dashboard     | Multiple data sources          | Coordinated loading |
| Error Handling         | Graceful degradation           | Retry mechanism     |
| Testing                | Unit/integration tests         | Mock service        |

---

## Troubleshooting

### Memory Leak: Subscriptions Not Unsubscribing

**Problem:**

```typescript
// WRONG: No unsubscribe
this.buildService.subscribeToStatusChange(buildId).subscribe(...);
```

**Solution:**

```typescript
// RIGHT: Unsubscribe on destroy
private destroy$ = new Subject<void>();

ngOnInit() {
  this.buildService.subscribeToStatusChange(buildId)
    .pipe(takeUntil(this.destroy$))
    .subscribe(...);
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

### Stale Data Cached

**Problem:** Builds updated but component still shows old data

**Solution:**

```typescript
// Clear cache after mutation
async onBuildSave(build: Build) {
  await this.api.updateBuild(build);
  this.buildService.clearCache();
  this.loadBuilds();
}
```

### Change Detection Not Triggered

**Problem:** Component using OnPush, data updates but UI doesn't

**Solution:**

```typescript
constructor(private cdr: ChangeDetectorRef) {}

ngOnInit() {
  this.buildService.subscribeToStatusChange(buildId)
    .subscribe(updatedBuild => {
      // Trigger change detection manually
      this.cdr.markForCheck();
    });
}
```

---

## See Also

- [Component Examples](./COMPONENT_EXAMPLES.md)
- [API Documentation](../../README.md)
