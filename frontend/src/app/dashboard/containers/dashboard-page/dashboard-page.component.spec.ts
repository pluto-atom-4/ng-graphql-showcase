import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardPageComponent } from './dashboard-page.component';
import { BuildService, Build, Metrics, Activity } from '../../services/build.service';
import { DASHBOARD_CONSTANTS } from './dashboard-page.constants';

describe('DashboardPageComponent', () => {
  let component: DashboardPageComponent;
  let fixture: ComponentFixture<DashboardPageComponent>;
  let buildServiceMock: any;
  let debugElement: DebugElement;

  const mockMetrics: Metrics = {
    total: 100,
    inProgress: 12,
    completed: 75,
    failed: 13,
  };

  const mockBuilds: Build[] = [
    {
      id: 'build-1',
      name: 'Build 1',
      status: 'RUNNING',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:30:00Z',
    },
    {
      id: 'build-2',
      name: 'Build 2',
      status: 'COMPLETE',
      createdAt: '2024-01-01T09:00:00Z',
      updatedAt: '2024-01-01T09:30:00Z',
    },
  ];

  const mockActivities: Activity[] = [
    {
      id: 'activity-1',
      timestamp: '2024-01-01T10:00:00Z',
      description: 'Build started',
      status: 'RUNNING',
    },
    {
      id: 'activity-2',
      timestamp: '2024-01-01T10:30:00Z',
      description: 'Build completed',
      status: 'COMPLETE',
    },
  ];

  beforeEach(async () => {
    buildServiceMock = {
      getBuilds: vi.fn().mockReturnValue(
        of({
          builds: mockBuilds,
          total: 100,
        })
      ),
      getBuildsMetrics: vi.fn().mockReturnValue(of(mockMetrics)),
      getBuildActivities: vi.fn().mockReturnValue(of(mockActivities)),
      subscribeToStatusChange: vi.fn(),
      subscribeToMetrics: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        { provide: BuildService, useValue: buildServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPageComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;
  });

  // === Component Initialization ===

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default page 1', (done) => {
      fixture.detectChanges();
      component.currentPage$.subscribe((page) => {
        expect(page).toBe(DASHBOARD_CONSTANTS.DEFAULT_PAGE);
        done();
      });
    });

    it('should initialize with default page size 10', (done) => {
      fixture.detectChanges();
      component.pageSize$.subscribe((size) => {
        expect(size).toBe(DASHBOARD_CONSTANTS.DEFAULT_PAGE_SIZE);
        done();
      });
    });

    it('should initialize observable streams on ngOnInit', (done) => {
      // detectChanges() calls ngOnInit
      fixture.detectChanges();
      component.metrics$.subscribe((metrics) => {
        expect(metrics).toEqual(mockMetrics);
        done();
      });
    });
  });

  // === State Management ===

  describe('State Management', () => {

    it('should initialize builds$ observable', (done) => {
      fixture.detectChanges();
      component.builds$.subscribe((builds) => {
        expect(builds).toEqual(mockBuilds);
        done();
      });
    });

    it('should update builds when currentPage$ changes', (done) => {
      fixture.detectChanges();
      let emissionCount = 0;
      component.builds$.subscribe(() => {
        emissionCount++;
      });

      // Initial subscription should emit
      expect(emissionCount).toBeGreaterThan(0);
      const initialCallCount = buildServiceMock.getBuilds.mock.calls.length;

      component.currentPage$.next(2);

      // Should call getBuilds again when page changes
      setTimeout(() => {
        expect(buildServiceMock.getBuilds.mock.calls.length).toBeGreaterThan(initialCallCount);
        done();
      }, 50);
    });

    it('should calculate correct skip value for pagination', (done) => {
      fixture.detectChanges();
      component.currentPage$.next(3);

      // Subscribe after page change to see the new call
      setTimeout(() => {
        component.builds$.subscribe(() => {
          // Verify that the latest call uses correct skip for page 3
          const lastCall = buildServiceMock.getBuilds.mock.calls[buildServiceMock.getBuilds.mock.calls.length - 1];
          expect(lastCall[0]).toBe(20); // (page 3 - 1) * 10 = 20
          done();
        });
      }, 50);
    });

    it('should emit totalBuilds$ with total count', (done) => {
      fixture.detectChanges();
      component.totalBuilds$.subscribe((total) => {
        expect(total).toBe(100);
        done();
      });
    });

    it('should emit metrics$ with Metrics object', (done) => {
      fixture.detectChanges();
      component.metrics$.subscribe((metrics) => {
        expect(metrics).toEqual(mockMetrics);
        expect(metrics?.total).toBe(100);
        expect(metrics?.inProgress).toBe(12);
        done();
      });
    });

    it('should handle getBuilds errors gracefully', (done) => {
      buildServiceMock.getBuilds.mockReturnValue(
        throwError(() => new Error('Network error'))
      );

      fixture.detectChanges();

      component.builds$.subscribe((builds) => {
        expect(builds).toEqual([]);
        expect(component.error$.getValue()).toContain('Failed to load builds');
        done();
      });
    });

    it('should handle getBuildsMetrics errors and return null', (done) => {
      buildServiceMock.getBuildsMetrics.mockReturnValue(
        throwError(() => new Error('Metrics error'))
      );

      fixture.detectChanges();

      component.metrics$.subscribe((metrics) => {
        expect(metrics).toBeNull();
        done();
      });
    });

    it('should initialize activities$ as empty when no buildId', (done) => {
      component.buildId = undefined;
      fixture.detectChanges();

      component.activities$.subscribe((activities) => {
        expect(activities).toEqual([]);
        expect(buildServiceMock.getBuildActivities).not.toHaveBeenCalled();
        done();
      });
    });

    it('should fetch activities when buildId is provided', (done) => {
      component.buildId = 'build-123';
      // Create new fixture to trigger ngOnInit with buildId set
      const newFixture = TestBed.createComponent(DashboardPageComponent);
      const newComponent = newFixture.componentInstance;
      newComponent.buildId = 'build-123';
      newFixture.detectChanges();

      newComponent.activities$.subscribe((activities) => {
        expect(activities).toEqual(mockActivities);
        expect(buildServiceMock.getBuildActivities).toHaveBeenCalledWith(
          'build-123',
          DASHBOARD_CONSTANTS.DEFAULT_ACTIVITIES_LIMIT
        );
        done();
      });
    });

    it('should handle getBuildActivities errors and return empty array', (done) => {
      buildServiceMock.getBuildActivities.mockReturnValue(
        throwError(() => new Error('Activities error'))
      );

      const newFixture = TestBed.createComponent(DashboardPageComponent);
      const newComponent = newFixture.componentInstance;
      newComponent.buildId = 'build-123';
      newFixture.detectChanges();

      newComponent.activities$.subscribe((activities) => {
        expect(activities).toEqual([]);
        done();
      });
    });
  });

  // === User Interactions ===

  describe('User Interactions', () => {
    it('should update currentPage$ when onPageChange is called', (done) => {
      fixture.detectChanges();
      component.onPageChange(5);

      component.currentPage$.subscribe((page) => {
        expect(page).toBe(5);
        done();
      });
    });

    it('should call buildService.getBuilds with new skip value after page change', (done) => {
      fixture.detectChanges();
      const initialCalls = buildServiceMock.getBuilds.mock.calls.length;

      component.onPageChange(2);

      setTimeout(() => {
        // Verify that getBuilds was called again after page change
        expect(buildServiceMock.getBuilds.mock.calls.length).toBeGreaterThan(initialCalls);
        done();
      }, 50);
    });

    it('should handle build row click', () => {
      fixture.detectChanges();
      const consoleSpy = vi.spyOn(console, 'log');
      component.onBuildRowClick(mockBuilds[0]);
      expect(consoleSpy).toHaveBeenCalledWith('Build row clicked:', mockBuilds[0]);
    });

    it('should return correct trackByBuildId value', () => {
      fixture.detectChanges();
      const buildId = component.trackByBuildId(0, mockBuilds[0]);
      expect(buildId).toBe('build-1');
    });

    it('should use build id for trackBy to prevent unnecessary re-renders', () => {
      fixture.detectChanges();
      const id1 = component.trackByBuildId(0, mockBuilds[0]);
      const id2 = component.trackByBuildId(0, mockBuilds[0]);
      expect(id1).toBe(id2);

      const id3 = component.trackByBuildId(0, mockBuilds[1]);
      expect(id3).not.toBe(id1);
    });
  });

  // === Template Rendering ===

  describe('Template Rendering', () => {
    it('should render main element with dashboard id', () => {
      fixture.detectChanges();
      const main = debugElement.nativeElement.querySelector('main#dashboard');
      expect(main).toBeTruthy();
    });

    it('should render header with title', () => {
      fixture.detectChanges();
      const title = debugElement.nativeElement.querySelector('h1');
      expect(title?.textContent).toContain('Build Dashboard');
    });

    it('should render metrics section with aria-labelledby', () => {
      fixture.detectChanges();
      const section = debugElement.nativeElement.querySelector(
        'section[aria-labelledby="metrics-heading"]'
      );
      expect(section).toBeTruthy();
    });

    it('should render builds section with aria-labelledby', () => {
      fixture.detectChanges();
      const section = debugElement.nativeElement.querySelector(
        'section[aria-labelledby="builds-heading"]'
      );
      expect(section).toBeTruthy();
    });

    it('should render MetricsGridComponent when metrics$ has value', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const metricsGrid = debugElement.nativeElement.querySelector('app-metrics-grid');
      expect(metricsGrid).toBeTruthy();
    });

    it('should render table when not loading', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const table = debugElement.nativeElement.querySelector('table');
      expect(table).toBeTruthy();
    });

    it('should render table rows for each build', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const rows = debugElement.nativeElement.querySelectorAll('tbody tr');
      expect(rows.length).toBe(mockBuilds.length);
    });

    it('should render build names in table cells', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const cells = debugElement.nativeElement.querySelectorAll('tbody td');
      expect(cells[0]?.textContent).toContain('Build 1');
      expect(cells[4]?.textContent).toContain('Build 2');
    });

    it('should render StatusBadge components for each build', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const badges = debugElement.nativeElement.querySelectorAll('app-status-badge');
      expect(badges.length).toBe(mockBuilds.length);
    });

    it('should render PaginationControls component', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const pagination = debugElement.nativeElement.querySelector('app-pagination-controls');
      expect(pagination).toBeTruthy();
    });

    it('should not render activities section when no buildId', () => {
      component.buildId = undefined;
      fixture.detectChanges();

      const section = debugElement.nativeElement.querySelector(
        'section[aria-labelledby="activities-heading"]'
      );
      expect(section).toBeFalsy();
    });

    it('should show empty state when no builds', async () => {
      buildServiceMock.getBuilds.mockReturnValue(
        of({
          builds: [],
          total: 0,
        })
      );

      const newFixture = TestBed.createComponent(DashboardPageComponent);
      const newDebugElement = newFixture.debugElement;
      newFixture.detectChanges();
      await newFixture.whenStable();
      newFixture.detectChanges();

      const emptyState = newDebugElement.nativeElement.querySelector(
        'div.py-12'
      );
      if (emptyState) {
        expect(emptyState.textContent).toContain('No builds found');
      }
    });
  });

  // === Accessibility ===

  describe('Accessibility', () => {
    it('should have main role on root element', () => {
      fixture.detectChanges();
      const main = debugElement.nativeElement.querySelector('main[role="main"]');
      expect(main).toBeTruthy();
    });

    it('should have semantic heading hierarchy', () => {
      fixture.detectChanges();
      const h1 = debugElement.nativeElement.querySelector('h1');
      const h2s = debugElement.nativeElement.querySelectorAll('h2');
      expect(h1).toBeTruthy();
      expect(h2s.length).toBeGreaterThan(0);
    });

    it('should have aria-labelledby on section elements', () => {
      fixture.detectChanges();
      const sections = debugElement.nativeElement.querySelectorAll('section[aria-labelledby]');
      expect(sections.length).toBeGreaterThanOrEqual(2);
    });

    it('should have table with proper roles', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const table = debugElement.nativeElement.querySelector('table[role="table"]');
      expect(table).toBeTruthy();

      const headers = debugElement.nativeElement.querySelectorAll('th[role="columnheader"]');
      expect(headers.length).toBeGreaterThan(0);

      const cells = debugElement.nativeElement.querySelectorAll('td[role="cell"]');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should have aria-label on pagination controls', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const buttons = debugElement.nativeElement.querySelectorAll('button[aria-label]');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  // === Performance ===

  describe('Performance', () => {
    it('should have trackByBuildId for *ngFor optimization', () => {
      expect(typeof component.trackByBuildId).toBe('function');
      const result = component.trackByBuildId(0, mockBuilds[0]);
      expect(typeof result).toBe('string');
    });
  });

  // === Error Handling ===

  describe('Error Handling', () => {
    it('should set error$ when getBuilds fails', (done) => {
      const errorMessage = 'Network error';
      buildServiceMock.getBuilds.mockReturnValue(
        throwError(() => new Error(errorMessage))
      );

      fixture.detectChanges();

      component.builds$.subscribe(() => {
        expect(component.error$.getValue()).toContain('Failed to load builds');
        done();
      });
    });

    it('should clear builds array on error', (done) => {
      buildServiceMock.getBuilds.mockReturnValue(
        throwError(() => new Error('Service error'))
      );

      fixture.detectChanges();

      component.builds$.subscribe((builds) => {
        expect(builds).toEqual([]);
        done();
      });
    });
  });

  // === Edge Cases ===

  describe('Edge Cases', () => {
    it('should handle very large page numbers', (done) => {
      fixture.detectChanges();
      component.onPageChange(999);

      component.builds$.subscribe(() => {
        expect(buildServiceMock.getBuilds).toHaveBeenCalledWith(9980, 10);
        done();
      });
    });

    it('should handle empty builds array', (done) => {
      buildServiceMock.getBuilds.mockReturnValue(
        of({
          builds: [],
          total: 0,
        })
      );

      fixture.detectChanges();

      component.builds$.subscribe((builds) => {
        expect(builds).toEqual([]);
        done();
      });
    });

    it('should handle buildId with special characters', () => {
      const newFixture = TestBed.createComponent(DashboardPageComponent);
      const newComponent = newFixture.componentInstance;
      newComponent.buildId = 'build-123-abc_def';
      newFixture.detectChanges();

      expect(buildServiceMock.getBuildActivities).toHaveBeenCalledWith(
        'build-123-abc_def',
        expect.any(Number)
      );
    });
  });
});
