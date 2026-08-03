# React-to-Angular Migration Guide

**Document Version:** 1.0  
**Last Updated:** 2026-08-03  
**Target Audience:** React developers transitioning to Angular

## Table of Contents

1. [Angular Fundamentals](#angular-fundamentals)
2. [Concept Mapping: React → Angular](#concept-mapping-react--angular)
3. [GraphQL & Real-Time Updates](#graphql--real-time-updates)
4. [State Management](#state-management)
5. [Common Pitfalls](#common-pitfalls)
6. [Performance Optimization](#performance-optimization)
7. [Testing](#testing)
8. [Resources](#resources)

---

## Angular Fundamentals

### Component Structure

Every Angular component has:

- **Selector:** HTML tag name (e.g., `app-button`)
- **Template:** HTML markup with Angular syntax
- **Styles:** Component-scoped CSS
- **Class:** TypeScript class defining logic and lifecycle

**Basic Component:**

```typescript
import { Component, Input, Output, EventEmitter } from "@angular/core";

@Component({
  selector: "app-button", // How you use it: <app-button></app-button>
  standalone: true, // Standalone component (no module needed)
  template: `<button (click)="onClick()">{{ label }}</button>`,
  styles: [
    `
      button {
        padding: 0.5rem 1rem;
      }
    `,
  ],
})
export class ButtonComponent {
  @Input() label = "Click me"; // Input prop
  @Output() clicked = new EventEmitter<void>(); // Output event

  onClick(): void {
    this.clicked.emit(); // Emit event to parent
  }
}
```

**Usage:**

```html
<!-- Parent component -->
<app-button label="Submit" (clicked)="onSubmit()"></app-button>
```

### Component Decorator

The `@Component` decorator configures the component:

```typescript
@Component({
  selector: "app-my-component",
  standalone: true, // Modern: no NgModule needed
  imports: [CommonModule, FormsModule],
  template: `<div>{{ message }}</div>`,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush, // Performance optimization
})
export class MyComponent {
  message = "Hello World";
}
```

### Inputs & Outputs

**Inputs** = React props (data flowing down)

```typescript
@Input() buildId: string = '';         // Required @Input
@Input() isLoading: boolean = false;   // Optional @Input with default
```

**Outputs** = React callbacks (events flowing up)

```typescript
@Output() onSave = new EventEmitter<Build>();
@Output() onCancel = new EventEmitter<void>();

// Emit event to parent
onSaveClick(): void {
  this.onSave.emit(this.build);
}
```

### Lifecycle Hooks

Angular components have defined lifecycle phases:

```typescript
export class MyComponent implements OnInit, OnDestroy {
  constructor(private service: MyService) {}

  ngOnInit(): void {
    // Called after component initialized
    // Good place to load data
    this.data$ = this.service.getData();
  }

  ngOnDestroy(): void {
    // Called when component destroyed
    // Clean up subscriptions, timers
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### Template Syntax

Angular templates use special directives:

```html
<!-- Interpolation (embed variables) -->
<p>{{ buildName }}</p>

<!-- Property binding (bind component property to DOM) -->
<button [disabled]="isLoading"></button>

<!-- Event binding (listen to DOM events) -->
<button (click)="onSubmit()"></button>

<!-- Two-way binding (React Hook Form equivalent) -->
<input [(ngModel)]="buildName" />

<!-- Directive: Loop over array -->
<div *ngFor="let build of builds; trackBy: trackByBuildId">
  {{ build.name }}
</div>

<!-- Directive: Conditional rendering -->
<div *ngIf="isLoading; else loadingPlaceholder">Content here</div>
<ng-template #loadingPlaceholder>
  <p>Loading...</p>
</ng-template>

<!-- Directive: Switch (like JS switch statement) -->
<div [ngSwitch]="build.status">
  <div *ngSwitchCase="'RUNNING'">Build running...</div>
  <div *ngSwitchCase="'COMPLETE'">Build complete!</div>
  <div *ngSwitchDefault>Unknown status</div>
</div>

<!-- Class binding -->
<div [class.active]="isActive" [class.disabled]="isDisabled">Content</div>
```

### Services & Dependency Injection

Angular services provide data access, like React custom hooks:

```typescript
@Injectable({ providedIn: "root" }) // Singleton service
export class BuildService {
  constructor(private apollo: Apollo) {}

  getBuilds(skip: number, take: number): Observable<BuildsResult> {
    return this.apollo
      .query<{ builds: Build[] }>({
        query: GET_BUILDS,
        variables: { skip, take },
      })
      .pipe(map((result) => result.data));
  }
}

// Usage in component
export class BuildListComponent {
  builds$: Observable<Build[]>;

  constructor(private buildService: BuildService) {
    // Service injected automatically
  }

  ngOnInit(): void {
    this.builds$ = this.buildService.getBuilds(0, 10);
  }
}
```

---

## Concept Mapping: React → Angular

### Props → @Input

**React:**

```jsx
function Button({ label, onClick }) {
  return <button onClick={onClick}>{label}</button>;
}

<Button label="Submit" onClick={onSubmit} />;
```

**Angular:**

```typescript
@Component({
  selector: 'app-button',
  template: `<button (click)="onClick()">{{ label }}</button>`
})
export class ButtonComponent {
  @Input() label = '';
  @Output() clicked = new EventEmitter<void>();

  onClick(): void {
    this.clicked.emit();
  }
}

// Usage
<app-button label="Submit" (clicked)="onSubmit()"></app-button>
```

### useState → Component Properties & Services

**React (useState):**

```jsx
function Dashboard() {
  const [builds, setBuilds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadBuilds();
  }, []);

  const loadBuilds = async () => {
    setIsLoading(true);
    const data = await api.getBuilds();
    setBuilds(data);
    setIsLoading(false);
  };

  return <div>{/* ... */}</div>;
}
```

**Angular (Component + Service):**

```typescript
export class DashboardComponent implements OnInit {
  builds: Build[] = [];
  isLoading = false;

  constructor(private buildService: BuildService) {}

  ngOnInit(): void {
    this.loadBuilds();
  }

  loadBuilds(): void {
    this.isLoading = true;
    this.buildService.getBuilds().subscribe((builds) => {
      this.builds = builds;
      this.isLoading = false;
    });
  }
}
```

Or using Observables (more Angular way):

```typescript
export class DashboardComponent implements OnInit {
  builds$: Observable<Build[]>;
  isLoading$: Observable<boolean>;

  constructor(private buildService: BuildService) {}

  ngOnInit(): void {
    const result$ = this.buildService.getBuilds().pipe(shareReplay(1));

    this.builds$ = result$.pipe(map((result) => result.builds));

    this.isLoading$ = result$.pipe(
      map(() => false),
      startWith(true),
    );
  }
}
```

### useEffect → ngOnInit & ngOnDestroy

**React (useEffect):**

```jsx
function Dashboard() {
  useEffect(() => {
    // Setup
    const subscription = api.subscribe((data) => {
      console.log("Data:", data);
    });

    // Cleanup
    return () => subscription.unsubscribe();
  }, []);
}
```

**Angular (Lifecycle Hooks):**

```typescript
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    // Setup
    this.api
      .subscribe()
      .pipe(takeUntil(this.destroy$)) // Auto-unsubscribe
      .subscribe((data) => {
        console.log("Data:", data);
      });
  }

  ngOnDestroy(): void {
    // Cleanup (automatic via takeUntil)
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### Custom Hooks → Services

**React (Custom Hook):**

```jsx
function useBuildService() {
  const [builds, setBuilds] = useState([]);

  useEffect(() => {
    const fetchBuilds = async () => {
      const data = await api.getBuilds();
      setBuilds(data);
    };
    fetchBuilds();
  }, []);

  return { builds };
}

function Dashboard() {
  const { builds } = useBuildService();
  return <div>{/* ... */}</div>;
}
```

**Angular (Service):**

```typescript
@Injectable({ providedIn: "root" })
export class BuildService {
  constructor(private http: HttpClient) {}

  getBuilds(): Observable<Build[]> {
    return this.http.get<Build[]>("/api/builds").pipe(shareReplay(1));
  }
}

export class DashboardComponent implements OnInit {
  builds$: Observable<Build[]>;

  constructor(private buildService: BuildService) {}

  ngOnInit(): void {
    this.builds$ = this.buildService.getBuilds();
  }
}
```

### Context/Redux → Services with RxJS Observables

**React (Redux):**

```jsx
// Store
const store = createStore(reducer);

// Component
function Dashboard() {
  const builds = useSelector((state) => state.builds);
  const dispatch = useDispatch();

  return <div>{/* ... */}</div>;
}
```

**Angular (Service + Observables):**

```typescript
@Injectable({ providedIn: "root" })
export class BuildStore {
  private builds$ = new BehaviorSubject<Build[]>([]);

  getBuilds(): Observable<Build[]> {
    return this.builds$.asObservable();
  }

  addBuild(build: Build): void {
    const current = this.builds$.value;
    this.builds$.next([...current, build]);
  }
}

export class DashboardComponent {
  builds$: Observable<Build[]>;

  constructor(private buildStore: BuildStore) {
    this.builds$ = this.buildStore.getBuilds();
  }

  onAddBuild(build: Build): void {
    this.buildStore.addBuild(build);
  }
}
```

---

## GraphQL & Real-Time Updates

### Apollo Client Setup (Same in React & Angular)

**Angular Setup:**

```typescript
// app.config.ts
import { ApolloClient, InMemoryCache } from "@apollo/client";
import { ApolloModule } from "apollo-angular";
import { HttpClientModule } from "@angular/common/http";

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    ApolloModule,
    {
      provide: "APOLLO_OPTIONS",
      useFactory: () => ({
        cache: new InMemoryCache(),
        link: new HttpLink({
          uri: "http://localhost:4000/graphql",
        }),
      }),
    },
  ],
};
```

### GraphQL Query

**React (apollo-client):**

```jsx
import { useQuery, gql } from "@apollo/client";

const GET_BUILDS = gql`
  query GetBuilds($skip: Int!, $take: Int!) {
    builds(skip: $skip, take: $take) {
      id
      name
      status
    }
  }
`;

function BuildList() {
  const { loading, data, error } = useQuery(GET_BUILDS, {
    variables: { skip: 0, take: 10 },
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      {data.builds.map((build) => (
        <div key={build.id}>{build.name}</div>
      ))}
    </div>
  );
}
```

**Angular (Apollo Angular):**

```typescript
import { Apollo, gql } from "apollo-angular";

const GET_BUILDS = gql`
  query GetBuilds($skip: Int!, $take: Int!) {
    builds(skip: $skip, take: $take) {
      id
      name
      status
    }
  }
`;

export class BuildListComponent implements OnInit {
  builds$: Observable<Build[]>;
  loading$ = new BehaviorSubject(false);
  error$ = new BehaviorSubject<string | null>(null);

  constructor(private apollo: Apollo) {}

  ngOnInit(): void {
    this.loading$.next(true);

    this.builds$ = this.apollo
      .query<{ builds: Build[] }>({
        query: GET_BUILDS,
        variables: { skip: 0, take: 10 },
      })
      .pipe(
        map((result) => result.data.builds),
        catchError((err) => {
          this.error$.next(err.message);
          return [];
        }),
        finalize(() => this.loading$.next(false)),
      );
  }
}
```

### GraphQL Subscription (Real-Time)

**React:**

```jsx
import { useSubscription, gql } from "@apollo/client";

const SUBSCRIBE_BUILD_STATUS = gql`
  subscription OnBuildStatusChange($buildId: String!) {
    buildStatusChanged(buildId: $buildId) {
      id
      status
      updatedAt
    }
  }
`;

function BuildDetail({ buildId }) {
  const { data, loading } = useSubscription(SUBSCRIBE_BUILD_STATUS, {
    variables: { buildId },
  });

  return <div>{data?.buildStatusChanged?.status}</div>;
}
```

**Angular:**

```typescript
const SUBSCRIBE_BUILD_STATUS = gql`
  subscription OnBuildStatusChange($buildId: String!) {
    buildStatusChanged(buildId: $buildId) {
      id
      status
      updatedAt
    }
  }
`;

export class BuildDetailComponent {
  build$: Observable<Build>;

  constructor(private apollo: Apollo) {}

  ngOnInit(): void {
    const buildId = "build-123";

    this.build$ = this.apollo
      .subscribe<{ buildStatusChanged: Build }>({
        query: SUBSCRIBE_BUILD_STATUS,
        variables: { buildId },
      })
      .pipe(
        map((result) => result.data.buildStatusChanged),
        bufferTime(250), // Aggregate rapid updates
        filter((updates) => updates.length > 0),
        mergeMap((updates) => updates),
        shareReplay(1),
      );
  }
}
```

### Handling High-Frequency Updates

**React (useCallback + useMemo):**

```jsx
function Dashboard() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    let timeout;
    const { data, unsubscribe } = subscribe((updates) => {
      // Debounce updates (like bufferTime)
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setMetrics(updates);
      }, 250);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);
}
```

**Angular (bufferTime + shareReplay):**

```typescript
export class MetricsDashboardComponent implements OnInit {
  metrics$: Observable<Metrics>;

  constructor(private buildService: BuildService) {}

  ngOnInit(): void {
    this.metrics$ = this.buildService.subscribeToMetrics().pipe(
      bufferTime(250), // Aggregate every 250ms
      filter((updates) => updates.length > 0),
      map((updates) => updates[updates.length - 1]), // Take last
      shareReplay(1),
    );
  }
}
```

---

## State Management

### Simple Component State (No Redux/NgRx Needed)

**React:**

```jsx
function BuildList() {
  const [builds, setBuilds] = useState([]);
  const [filter, setFilter] = useState("");

  const filtered = builds.filter((b) => b.name.includes(filter));

  return (
    <div>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} />
      {filtered.map((build) => (
        <div key={build.id}>{build.name}</div>
      ))}
    </div>
  );
}
```

**Angular:**

```typescript
export class BuildListComponent implements OnInit {
  builds: Build[] = [];
  filter = "";

  constructor(private buildService: BuildService) {}

  ngOnInit(): void {
    this.buildService.getBuilds().subscribe((builds) => (this.builds = builds));
  }

  get filtered(): Build[] {
    return this.builds.filter((b) => b.name.includes(this.filter));
  }
}
```

### Observable State (Better for Angular)

**Using RxJS Observables:**

```typescript
export class BuildListComponent {
  filter$ = new BehaviorSubject<string>("");
  builds$: Observable<Build[]>;

  constructor(private buildService: BuildService) {}

  ngOnInit(): void {
    this.builds$ = combineLatest([
      this.buildService.getBuilds(),
      this.filter$,
    ]).pipe(
      map(([builds, filter]) => builds.filter((b) => b.name.includes(filter))),
      shareReplay(1),
    );
  }

  onFilterChange(filter: string): void {
    this.filter$.next(filter);
  }
}
```

---

## Common Pitfalls

### Pitfall 1: Missing trackBy on *ngFor

**Problem:**

```html
<!-- WRONG: Re-creates entire DOM for each item on change -->
<div *ngFor="let build of builds">{{ build.name }}</div>
```

**Solution:**

```typescript
trackByBuildId(index: number, build: Build): string {
  return build.id;  // Key used to identify items
}
```

```html
<!-- RIGHT: Reuses DOM elements -->
<div *ngFor="let build of builds; trackBy: trackByBuildId">
  {{ build.name }}
</div>
```

**Impact:**

- Without trackBy: 1000 items = 1000 DOM recreations per change
- With trackBy: 1000 items = only changed items updated

### Pitfall 2: Forgetting OnPush Change Detection

**Problem (Heavy computation on every event):**

```typescript
@Component({
  // Default: ChangeDetectionStrategy.Default (checks whole tree every event)
  template: `...`,
})
export class MyComponent {}
```

**Solution (Manual control):**

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush, // Only check on @Input change
})
export class MyComponent {
  @Input() build!: Build;

  constructor(private cdr: ChangeDetectorRef) {}

  // Only manually trigger when needed
  ngAfterViewInit(): void {
    this.cdr.markForCheck();
  }
}
```

**Impact:**

- Default: Heavy computation, slow with large lists
- OnPush: Minimal computation, fast even with 10K items

### Pitfall 3: Memory Leaks from Unsubscribed Observables

**Problem:**

```typescript
export class MyComponent implements OnInit {
  ngOnInit(): void {
    // WRONG: Never unsubscribes
    this.buildService.getBuilds().subscribe((builds) => {
      this.builds = builds;
    });
  }
}
```

**Solution:**

```typescript
export class MyComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // RIGHT: Unsubscribes on destroy
    this.buildService
      .getBuilds()
      .pipe(takeUntil(this.destroy$))
      .subscribe((builds) => (this.builds = builds));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**Impact:**

- Without cleanup: Memory leaks, 1000s of subscriptions pile up
- With cleanup: Clean memory, no leaks

### Pitfall 4: Mutations Don't Trigger Change Detection

**Problem:**

```typescript
export class MyComponent {
  builds: Build[] = [];

  ngOnInit(): void {
    this.buildService.getBuilds().subscribe((builds) => {
      this.builds = builds;
      // WRONG: Mutating array doesn't trigger CD
      this.builds.push(newBuild);
    });
  }
}
```

**Solution:**

```typescript
ngOnInit(): void {
  this.buildService.getBuilds()
    .subscribe(builds => {
      this.builds = builds;
      // RIGHT: Create new reference
      this.builds = [...this.builds, newBuild];
      // Or with OnPush:
      this.cdr.markForCheck();
    });
}
```

**Impact:**

- Mutation: UI doesn't update
- Immutable: UI updates correctly

### Pitfall 5: Subscribing Multiple Times

**Problem:**

```html
<!-- WRONG: Subscribes multiple times! -->
<div>{{ (builds$ | async)?.length }}</div>
<div *ngFor="let build of (builds$ | async)">{{ build.name }}</div>
```

**Solution:**

```typescript
export class MyComponent {
  builds$: Observable<Build[]>;

  ngOnInit(): void {
    // Single subscription, shared
    this.builds$ = this.buildService.getBuilds().pipe(
      shareReplay(1), // Cache and share
    );
  }
}
```

```html
<!-- RIGHT: Single subscription -->
<ng-container *ngIf="builds$ | async as builds">
  <div>{{ builds.length }}</div>
  <div *ngFor="let build of builds; trackBy: trackByBuildId">
    {{ build.name }}
  </div>
</ng-container>
```

---

## Performance Optimization

### Rule 1: Use OnPush Change Detection

```typescript
@Component({
  selector: "app-metric-card",
  template: `<div>{{ count }}</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush, // Essential
})
export class MetricCardComponent {
  @Input() count!: number;
}
```

### Rule 2: Always Use trackBy

```html
<div *ngFor="let item of items; trackBy: trackById">{{ item.name }}</div>
```

### Rule 3: Unsubscribe on Destroy

```typescript
private destroy$ = new Subject<void>();

ngOnInit(): void {
  this.observable
    .pipe(takeUntil(this.destroy$))
    .subscribe(...);
}

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}
```

### Rule 4: Use shareReplay for Shared Data

```typescript
this.builds$ = this.buildService.getBuilds().pipe(
  shareReplay(1), // Single subscription, shared result
);
```

### Rule 5: Buffer High-Frequency Updates

```typescript
this.buildService.subscribeToStatusChange(buildId)
  .pipe(
    bufferTime(250),  // Aggregate every 250ms
    filter(updates => updates.length > 0)
  )
  .subscribe(...);
```

---

## Testing

### Unit Test (Angular with Vitest)

**React (Jest):**

```jsx
import { render, screen, fireEvent } from "@testing-library/react";

test("renders build list", () => {
  render(<BuildList builds={[{ id: "1", name: "Test" }]} />);
  expect(screen.getByText("Test")).toBeInTheDocument();
});
```

**Angular (Vitest):**

```typescript
import { render, screen } from "@angular/testing-library";
import { BuildListComponent } from "./build-list.component";

describe("BuildListComponent", () => {
  it("renders build list", () => {
    const { fixture } = render(BuildListComponent, {
      componentProperties: {
        builds: [
          {
            id: "1",
            name: "Test",
            status: "COMPLETE",
            createdAt: "",
            updatedAt: "",
          },
        ],
      },
    });

    expect(screen.getByText("Test")).toBeInTheDocument();
  });
});
```

### Mocking Services

**React:**

```jsx
const mockBuildService = {
  getBuilds: jest.fn().mockResolvedValue([{ id: "1", name: "Test" }]),
};

test("loads builds on init", async () => {
  render(<Dashboard buildService={mockBuildService} />);
  await waitFor(() => expect(screen.getByText("Test")).toBeInTheDocument());
});
```

**Angular:**

```typescript
it("loads builds on init", fakeAsync(() => {
  const mockBuildService = jasmine.createSpyObj("BuildService", ["getBuilds"]);
  mockBuildService.getBuilds.and.returnValue(
    of([
      {
        id: "1",
        name: "Test",
        status: "COMPLETE",
        createdAt: "",
        updatedAt: "",
      },
    ]),
  );

  TestBed.configureTestingModule({
    providers: [{ provide: BuildService, useValue: mockBuildService }],
  });

  const component =
    TestBed.createComponent(DashboardComponent).componentInstance;
  component.ngOnInit();
  tick();

  expect(mockBuildService.getBuilds).toHaveBeenCalled();
}));
```

---

## Resources

### Official Documentation

- [Angular Official Docs](https://angular.io/docs)
- [Angular API Reference](https://angular.io/api)
- [Angular Architecture Guide](https://angular.io/guide/architecture)
- [RxJS Documentation](https://rxjs.dev)

### Learning Path

1. **Basics:** Components, templates, data binding
2. **Intermediate:** Services, dependency injection, observables
3. **Advanced:** Change detection, performance, custom directives

### Key Differences

| Concept      | React               | Angular                    |
| ------------ | ------------------- | -------------------------- |
| State        | useState, Redux     | RxJS Observables, services |
| Props        | Function parameters | @Input decorators          |
| Events       | Callbacks           | @Output EventEmitters      |
| Side Effects | useEffect           | ngOnInit/ngOnDestroy       |
| Loops        | map(), filter()     | *ngFor with trackBy        |
| Conditionals | && or ternary       | *ngIf with else            |
| Styling      | CSS-in-JS or CSS    | Scoped component styles    |
| Testing      | Jest + RTL          | Karma/Jasmine or Vitest    |

### Community

- [Angular Discord](https://discord.gg/angular)
- [Stack Overflow: angular tag](https://stackoverflow.com/questions/tagged/angular)
- [Angular Reddit](https://www.reddit.com/r/Angular2/)

---

## Migration Checklist

When converting React component to Angular:

- [ ] Create component class with @Component decorator
- [ ] Define @Input properties (React props)
- [ ] Define @Output EventEmitters (React callbacks)
- [ ] Convert template syntax (interpolation, binding, directives)
- [ ] Create or inject services for data access
- [ ] Implement ngOnInit for initialization
- [ ] Implement ngOnDestroy with unsubscribe logic
- [ ] Use OnPush change detection for performance
- [ ] Add trackBy to all *ngFor loops
- [ ] Add unit tests with Vitest
- [ ] Verify accessibility (keyboard nav, ARIA labels)
- [ ] Performance testing (Lighthouse audit)

---

## Quick Reference: Angular Syntax

```html
<!-- Interpolation -->
{{ variable }} {{ function() }} {{ variable | pipe }}

<!-- Property Binding -->
[property]="value" [disabled]="isDisabled" [class.active]="isActive"

<!-- Event Binding -->
(click)="onClick()" (keydown.enter)="onEnter()" (change)="onChange($event)"

<!-- Two-way Binding -->
[(ngModel)]="value"

<!-- Directive: Loop -->
*ngFor="let item of items; trackBy: trackById"

<!-- Directive: Conditional -->
*ngIf="condition" *ngIf="condition; else template"

<!-- Directive: Switch -->
*ngSwitch="value" *ngSwitchCase="'case1'" *ngSwitchDefault

<!-- Attribute Binding -->
[attr.aria-label]="label" [attr.data-id]="id"

<!-- Style Binding -->
[style.color]="color" [ngStyle]="{ color: 'red', fontSize: '14px' }"

<!-- Class Binding -->
[class]="className" [ngClass]="{ active: isActive, disabled: isDisabled }"

<!-- Template Reference Variable -->
#myInput {{ myInput.value }}

<!-- Safe Navigation Operator -->
{{ user?.name }}

<!-- Safe Indexing -->
{{ items?.[0]?.name }}

<!-- RxJS async pipe (Unsubscribes automatically) -->
{{ data$ | async }} *ngFor="let item of items$ | async"
```

---

## Next Steps

1. **Read:** Angular official architecture guide
2. **Practice:** Convert one React component to Angular
3. **Review:** Our component examples in COMPONENT_EXAMPLES.md
4. **Test:** Follow testing patterns in this guide
5. **Optimize:** Apply performance patterns from this guide

---

**Questions? Check:**

- Official [Angular Docs](https://angular.io/docs)
- Our [COMPONENT_EXAMPLES.md](./COMPONENT_EXAMPLES.md)
- Our [BUILDSERVICE_INTEGRATION.md](./BUILDSERVICE_INTEGRATION.md)
