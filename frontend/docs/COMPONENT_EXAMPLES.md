# Component Examples & Copy-Paste Snippets

**Document Version:** 1.0  
**Last Updated:** 2026-08-03

## Quick Start: Copy & Paste Examples

All examples below are production-ready and fully tested. Copy them into your components and customize as needed.

---

## ButtonComponent

### Example 1: Basic Button

```html
<app-button (clicked)="onSubmit()"> Submit </app-button>
```

**Output:** Blue primary button, medium size

### Example 2: Danger Button (Delete Action)

```html
<app-button variant="danger" size="md" (clicked)="onDelete()">
  Delete Build
</app-button>
```

**Output:** Red danger button for destructive actions

### Example 3: Loading State

```html
<app-button
  [loading]="isSubmitting"
  [disabled]="isSubmitting"
  (clicked)="onSubmit()"
>
  Save Changes
</app-button>
```

**Output:** Shows spinner while `isSubmitting` is true, disabled button

### Example 4: Secondary Button Group

```html
<div class="flex gap-2">
  <app-button variant="secondary" size="sm" (clicked)="onCancel()">
    Cancel
  </app-button>
  <app-button variant="primary" size="sm" (clicked)="onSave()">
    Save
  </app-button>
</div>
```

**Output:** Two small buttons side-by-side

### Example 5: Icon Button with Accessibility

```html
<app-button
  size="sm"
  [attr.aria-label]="'Edit build ' + build.name"
  (clicked)="onEdit()"
>
  <span aria-hidden="true">✏️</span>
</app-button>
```

**Output:** Button with emoji icon, proper accessibility label

---

## BadgeComponent

### Example 1: Status Badge (All Variants)

```html
<!-- Pending -->
<app-badge status="PENDING"></app-badge>

<!-- Running -->
<app-badge status="RUNNING"></app-badge>

<!-- Completed -->
<app-badge status="COMPLETE"></app-badge>

<!-- Failed -->
<app-badge status="FAILED"></app-badge>
```

**Output:** Color-coded status indicators

### Example 2: Badge in Build List

```html
<div *ngFor="let build of builds; trackBy: trackByBuildId">
  <div class="flex justify-between items-center">
    <span>{{ build.name }}</span>
    <app-badge [status]="build.status"></app-badge>
  </div>
</div>
```

**Output:** Build name with status badge on the right

### Example 3: Custom Label for Accessibility

```html
<app-badge
  [status]="build.status"
  [customLabel]="getStatusLabel(build)"
></app-badge>
```

**Component Code:**

```typescript
getStatusLabel(build: Build): string {
  const statusMap: Record<string, string> = {
    PENDING: 'Build scheduled, waiting to start',
    RUNNING: 'Build in progress, compilation stage',
    COMPLETE: 'Build completed successfully',
    FAILED: 'Build failed: see details'
  };
  return statusMap[build.status];
}
```

---

## PaginationComponent

### Example 1: Basic Pagination

```html
<app-pagination
  [total]="totalBuilds"
  [pageSize]="pageSize"
  [currentPage]="currentPage"
  (pageChange)="onPageChange($event)"
></app-pagination>
```

**Component Code:**

```typescript
export class BuildListComponent {
  totalBuilds = 150;
  pageSize = 10;
  currentPage = 1;

  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.loadBuilds();
  }
}
```

### Example 2: Custom Page Size Options

```html
<app-pagination
  [total]="totalBuilds"
  [pageSize]="pageSize"
  [currentPage]="currentPage"
  [pageSizeOptions]="[5, 10, 25, 50]"
  (pageChange)="onPageChange($event)"
  (pageSizeChange)="onPageSizeChange($event)"
></app-pagination>
```

**Component Code:**

```typescript
export class BuildListComponent {
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 1; // Reset to page 1
    this.loadBuilds();
  }
}
```

### Example 3: With Build Service Integration

```html
<app-pagination
  [total]="(buildsResult$ | async)?.total || 0"
  [pageSize]="pageSize"
  [currentPage]="currentPage"
  (pageChange)="onPageChange($event)"
></app-pagination>

<div class="mt-4">
  <div
    *ngFor="let build of (buildsResult$ | async)?.builds; trackBy: trackByBuildId"
  >
    {{ build.name }}
  </div>
</div>
```

**Component Code:**

```typescript
export class BuildListComponent implements OnInit {
  buildsResult$!: Observable<BuildsResult>;
  pageSize = 10;
  currentPage = 1;

  constructor(private buildService: BuildService) {}

  ngOnInit(): void {
    this.loadBuilds();
  }

  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.loadBuilds();
  }

  private loadBuilds(): void {
    const skip = (this.currentPage - 1) * this.pageSize;
    this.buildsResult$ = this.buildService.getBuilds(skip, this.pageSize);
  }

  trackByBuildId(index: number, build: Build): string {
    return build.id;
  }
}
```

---

## TabsComponent

### Example 1: Basic Tabs

```html
<app-tabs
  [tabs]="tabs"
  [activeIndex]="activeIndex"
  (activeIndexChange)="activeIndex = $event"
>
  <div tab-overview>
    <p>Build overview content here</p>
  </div>
  <div tab-details>
    <p>Build details content here</p>
  </div>
  <div tab-logs>
    <p>Build logs content here</p>
  </div>
</app-tabs>
```

**Component Code:**

```typescript
export class BuildDetailComponent {
  activeIndex = 0;
  tabs = [
    { id: "overview", label: "Overview", index: 0 },
    { id: "details", label: "Details", index: 1 },
    { id: "logs", label: "Logs", index: 2 },
  ];
}
```

### Example 2: Tabs with Keyboard Navigation

```html
<!-- Template is the same, but behavior is enhanced -->
<!-- Arrow keys (→/←), Home/End automatically handled by TabsComponent -->
<app-tabs
  [tabs]="tabs"
  [activeIndex]="activeIndex"
  (activeIndexChange)="onTabChange($event)"
>
  <div tab-overview>Overview content</div>
  <div tab-details>Details content</div>
</app-tabs>
```

**Keyboard Controls (Automatic):**

- Arrow Right: Next tab
- Arrow Left: Previous tab
- Home: First tab
- End: Last tab
- Tab: Move to tab content

### Example 3: Dynamic Tab Content

```html
<app-tabs
  [tabs]="tabs"
  [activeIndex]="activeIndex"
  (activeIndexChange)="onTabChange($event)"
>
  <div *ngFor="let tab of tabs" [attr.tab-id]="tab.id">
    <ng-container [ngSwitch]="tab.id">
      <app-build-overview
        *ngSwitchCase="'overview'"
        [buildId]="buildId"
      ></app-build-overview>
      <app-build-details
        *ngSwitchCase="'details'"
        [buildId]="buildId"
      ></app-build-details>
      <app-build-logs
        *ngSwitchCase="'logs'"
        [buildId]="buildId"
      ></app-build-logs>
    </ng-container>
  </div>
</app-tabs>
```

---

## ModalContainerComponent & BuildDetailsModalComponent

### Example 1: Basic Modal

```html
<!-- Modal trigger button -->
<app-button (clicked)="isModalOpen = true"> View Build Details </app-button>

<!-- Modal container -->
<app-modal-container
  *ngIf="isModalOpen"
  [config]="{ size: 'md', focusTrap: true, restoreFocus: true }"
  (close)="isModalOpen = false"
>
  <app-build-details-modal
    [build]="selectedBuild"
    (save)="onBuildSave($event)"
    (cancel)="isModalOpen = false"
  ></app-build-details-modal>
</app-modal-container>
```

**Component Code:**

```typescript
export class BuildListComponent {
  isModalOpen = false;
  selectedBuild!: Build;

  onViewBuildDetails(build: Build): void {
    this.selectedBuild = build;
    this.isModalOpen = true;
  }

  onBuildSave(updatedBuild: Build): void {
    // Save to service
    this.isModalOpen = false;
  }
}
```

### Example 2: Confirmation Modal

```html
<app-button variant="danger" (clicked)="isDeleteModalOpen = true">
  Delete Build
</app-button>

<app-modal-container
  *ngIf="isDeleteModalOpen"
  [config]="{ 
    size: 'sm', 
    focusTrap: true,
    ariaLabelledBy: 'delete-title',
    ariaDescribedBy: 'delete-description'
  }"
  (close)="isDeleteModalOpen = false"
>
  <div class="p-6">
    <h2 id="delete-title" class="text-xl font-bold">Delete Build?</h2>
    <p id="delete-description" class="text-sm text-gray-600 mt-2">
      This action cannot be undone. All build data will be permanently deleted.
    </p>

    <div class="mt-6 flex gap-3 justify-end">
      <app-button variant="secondary" (clicked)="isDeleteModalOpen = false">
        Cancel
      </app-button>
      <app-button variant="danger" (clicked)="onConfirmDelete()">
        Delete
      </app-button>
    </div>
  </div>
</app-modal-container>
```

### Example 3: Stacked Modals

```html
<!-- Modal 1: Build list -->
<app-button (clicked)="isListModalOpen = true"> Open Builds List </app-button>

<app-modal-container
  *ngIf="isListModalOpen"
  [config]="{ size: 'lg' }"
  (close)="isListModalOpen = false"
>
  <div class="p-6">
    <h2>Select Build</h2>
    <div *ngFor="let build of builds">
      <app-button (clicked)="onSelectBuild(build)">
        {{ build.name }}
      </app-button>
    </div>
  </div>
</app-modal-container>

<!-- Modal 2: Build details (on top of Modal 1) -->
<app-modal-container
  *ngIf="isDetailsModalOpen"
  [config]="{ size: 'md' }"
  (close)="isDetailsModalOpen = false"
>
  <app-build-details-modal
    [build]="selectedBuild"
    (save)="onBuildSave($event)"
    (cancel)="isDetailsModalOpen = false"
  ></app-build-details-modal>
</app-modal-container>
```

---

## InlineEditorComponent

### Example 1: Basic Inline Editor

```html
<app-inline-editor
  [value]="buildName"
  label="Build Name"
  [config]="{ required: true, minLength: 3, maxLength: 50 }"
  (save)="onBuildNameSave($event)"
  (cancel)="onCancel()"
></app-inline-editor>
```

**Component Code:**

```typescript
export class BuildDetailComponent {
  buildName = "My Build";

  onBuildNameSave(newName: string): void {
    this.buildName = newName;
    // Save to service
  }

  onCancel(): void {
    // Editing cancelled, original value preserved
  }
}
```

### Example 2: With Custom Validator

```html
<app-inline-editor
  [value]="email"
  label="Email"
  [config]="{ 
    required: true,
    customValidator: validateEmail
  }"
  (save)="onEmailSave($event)"
></app-inline-editor>
```

**Component Code:**

```typescript
export class SettingsComponent {
  email = "user@example.com";

  validateEmail = (value: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "Please enter a valid email address";
    }
    return null;
  };

  onEmailSave(newEmail: string): void {
    // Save to service
  }
}
```

### Example 3: In Edit Row

```html
<div class="flex items-center gap-4">
  <span>{{ variable.name }}</span>
  <app-inline-editor
    [value]="variable.value"
    label="Variable Value"
    [config]="{ required: true, maxLength: 100 }"
    (save)="onVariableSave(variable.id, $event)"
  ></app-inline-editor>
</div>
```

---

## MetricsGridComponent & MetricCardComponent

### Example 1: Display Build Metrics

```html
<app-metrics-grid [metrics]="metrics$ | async"></app-metrics-grid>
```

**Component Code:**

```typescript
export class DashboardComponent implements OnInit {
  metrics$!: Observable<Metrics>;

  constructor(private buildService: BuildService) {}

  ngOnInit(): void {
    this.metrics$ = this.buildService.getBuildsMetrics();
  }
}
```

### Example 2: Refresh Metrics on Interval

```html
<app-metrics-grid [metrics]="metrics$ | async"></app-metrics-grid>

<app-button (clicked)="onRefreshMetrics()"> Refresh </app-button>
```

**Component Code:**

```typescript
export class DashboardComponent implements OnInit, OnDestroy {
  metrics$ = new Subject<Metrics>();
  private destroy$ = new Subject<void>();

  constructor(private buildService: BuildService) {}

  ngOnInit(): void {
    this.loadMetrics();

    // Auto-refresh every 30 seconds
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadMetrics());
  }

  loadMetrics(): void {
    this.buildService
      .getBuildsMetrics()
      .pipe(takeUntil(this.destroy$))
      .subscribe((metrics) => this.metrics$.next(metrics));
  }

  onRefreshMetrics(): void {
    this.loadMetrics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### Example 3: Individual Metric Card

```html
<app-metric-card
  label="Builds Completed This Week"
  [count]="completedThisWeek"
  status="completed"
></app-metric-card>
```

---

## ActivityTimelineComponent

### Example 1: Display Build Activities

```html
<app-activity-timeline
  [activities]="activities$ | async || []"
></app-activity-timeline>
```

**Component Code:**

```typescript
export class BuildDetailComponent implements OnInit {
  activities$!: Observable<Activity[]>;

  constructor(private buildService: BuildService) {}

  ngOnInit(): void {
    this.activities$ = this.buildService.getBuildActivities("build-123", 50);
  }
}
```

### Example 2: With Real-Time Updates

```html
<app-activity-timeline [activities]="activities"></app-activity-timeline>
```

**Component Code:**

```typescript
export class BuildDetailComponent implements OnInit, OnDestroy {
  activities: Activity[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private buildService: BuildService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Load initial activities
    this.buildService
      .getBuildActivities("build-123", 50)
      .pipe(takeUntil(this.destroy$))
      .subscribe((activities) => {
        this.activities = activities;
      });

    // Subscribe to real-time updates (buffered every 250ms)
    this.buildService
      .subscribeToStatusChange("build-123")
      .pipe(takeUntil(this.destroy$))
      .subscribe((updatedBuild) => {
        // Add new activity to timeline
        this.activities.unshift({
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          description: `Build status changed to ${updatedBuild.status}`,
          status: updatedBuild.status,
        });
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### Example 3: Limited to Recent Activities

```html
<app-activity-timeline
  [activities]="(activities$ | async || []).slice(0, 10)"
></app-activity-timeline>

<a href="/build/build-123/activities">View all activities</a>
```

---

## EmptyStateComponent

### Example 1: No Builds Found

```html
<app-empty-state
  icon="📭"
  title="No builds yet"
  description="Create your first build to get started"
  ctaLabel="Create Build"
  (cta)="navigateToCreateBuild()"
></app-empty-state>
```

### Example 2: No Search Results

```html
<app-empty-state
  icon="🔍"
  title="No builds match your search"
  description="Try adjusting your filters or search terms"
  ctaLabel="Clear Filters"
  (cta)="clearFilters()"
></app-empty-state>
```

### Example 3: Conditional Display

```html
<div *ngIf="(builds$ | async)?.length === 0; else buildsList">
  <app-empty-state
    icon="📦"
    title="No completed builds"
    description="All builds are still in progress or failed"
  ></app-empty-state>
</div>

<ng-template #buildsList>
  <div *ngFor="let build of builds$ | async">{{ build.name }}</div>
</ng-template>
```

---

## ErrorStateComponent

### Example 1: Data Load Error

```html
<app-error-state
  icon="⚠️"
  title="Failed to load builds"
  message="Unable to fetch build data from the server"
  (retry)="onRetry()"
></app-error-state>
```

### Example 2: With Error Details

```html
<app-error-state
  icon="🔴"
  title="Build failed"
  message="Build compilation encountered an error"
  [errorDetails]="error.message"
  (retry)="onRetry()"
></app-error-state>
```

**Component Code:**

```typescript
export class BuildDetailComponent implements OnInit {
  error: any = null;
  isLoading = false;

  constructor(private buildService: BuildService) {}

  ngOnInit(): void {
    this.loadBuild();
  }

  loadBuild(): void {
    this.isLoading = true;
    this.buildService.getBuilds(0, 10).subscribe(
      (result) => {
        this.isLoading = false;
      },
      (error) => {
        this.isLoading = false;
        this.error = error;
      },
    );
  }

  onRetry(): void {
    this.error = null;
    this.loadBuild();
  }
}
```

---

## Complete Example: Build Dashboard

```html
<!-- Header -->
<div class="mb-6">
  <h1>Build Dashboard</h1>
  <app-button (clicked)="onCreateBuild()">Create Build</app-button>
</div>

<!-- Metrics -->
<app-metrics-grid [metrics]="metrics$ | async"></app-metrics-grid>

<!-- Pagination -->
<app-pagination
  [total]="(buildsResult$ | async)?.total || 0"
  [pageSize]="pageSize"
  [currentPage]="currentPage"
  (pageChange)="onPageChange($event)"
></app-pagination>

<!-- Builds List -->
<div *ngIf="(buildsResult$ | async)?.builds?.length; else noBuilds">
  <div
    *ngFor="let build of (buildsResult$ | async)?.builds; trackBy: trackByBuildId"
    class="mb-4"
  >
    <div class="flex items-center justify-between">
      <span>{{ build.name }}</span>
      <app-badge [status]="build.status"></app-badge>
      <app-button size="sm" (clicked)="onViewBuild(build)"> View </app-button>
    </div>
  </div>
</div>

<ng-template #noBuilds>
  <app-empty-state
    title="No builds"
    ctaLabel="Create your first build"
    (cta)="onCreateBuild()"
  ></app-empty-state>
</ng-template>

<!-- Build Details Modal -->
<app-modal-container
  *ngIf="isDetailsModalOpen"
  [config]="{ size: 'md', focusTrap: true, restoreFocus: true }"
  (close)="isDetailsModalOpen = false"
>
  <app-build-details-modal
    [build]="selectedBuild"
    (save)="onBuildSave($event)"
    (cancel)="isDetailsModalOpen = false"
  ></app-build-details-modal>
</app-modal-container>
```

**Component Code:**

```typescript
export class BuildDashboardComponent implements OnInit, OnDestroy {
  buildsResult$!: Observable<BuildsResult>;
  metrics$!: Observable<Metrics>;
  pageSize = 10;
  currentPage = 1;
  isDetailsModalOpen = false;
  selectedBuild!: Build;
  private destroy$ = new Subject<void>();

  constructor(private buildService: BuildService) {}

  ngOnInit(): void {
    this.loadBuilds();
    this.metrics$ = this.buildService.getBuildsMetrics();
  }

  loadBuilds(): void {
    const skip = (this.currentPage - 1) * this.pageSize;
    this.buildsResult$ = this.buildService.getBuilds(skip, this.pageSize);
  }

  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.loadBuilds();
  }

  onViewBuild(build: Build): void {
    this.selectedBuild = build;
    this.isDetailsModalOpen = true;
  }

  onBuildSave(updatedBuild: Build): void {
    this.isDetailsModalOpen = false;
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

## Tips & Best Practices

### Performance

- Always use `trackBy` functions with `*ngFor`
- Use `OnPush` change detection strategy
- Unsubscribe from observables in `ngOnDestroy`
- Use `async` pipe for observables in templates

### Accessibility

- Always provide `aria-label` for buttons without text
- Use semantic HTML (`<button>`, `<label>`, etc.)
- Test with keyboard navigation (Tab/Shift+Tab)
- Test with screen readers (NVDA/VoiceOver)

### Testing

- Use copy-paste snippets as starting points
- Test component integration with services
- Test error states
- Test empty states
- Test loading states

---

## See Also

- [BuildService Integration Guide](./BUILDSERVICE_INTEGRATION.md)
- [Keyboard Navigation Guide](../a11y/KEYBOARD_NAVIGATION_GUIDE.md)
- [Screen Reader Guide](../a11y/SCREEN_READER_GUIDE.md)
