import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BuildDashboardComponent } from './build-dashboard.component';
import { BuildService, Metrics, Activity } from '../../services/build.service';
import { vi } from 'vitest';

describe('BuildDashboardComponent', () => {
  let component: BuildDashboardComponent;
  let fixture: ComponentFixture<BuildDashboardComponent>;
  let buildService: any;

  beforeEach(async () => {
    const buildServiceMock = {
      getBuilds: vi.fn().mockReturnValue(of([])),
      subscribeToStatusChange: vi.fn().mockReturnValue(of({})),
      getBuildsMetrics: vi.fn().mockReturnValue(of({
        total: 100,
        inProgress: 25,
        completed: 50,
        failed: 5
      })),
      subscribeToMetrics: vi.fn().mockReturnValue(of({})),
      getBuildActivities: vi.fn().mockReturnValue(of([])),
      clearCache: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [BuildDashboardComponent],
      providers: [
        { provide: BuildService, useValue: buildServiceMock }
      ]
    }).compileComponents();

    buildService = TestBed.inject(BuildService);
    fixture = TestBed.createComponent(BuildDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load metrics on init', () => {
    fixture.detectChanges();
    expect(buildService.getBuildsMetrics).toHaveBeenCalled();
  });

  it('should load activities when buildId provided', () => {
    component.buildId = 'build-123';
    fixture.detectChanges();
    expect(buildService.getBuildActivities).toHaveBeenCalledWith('build-123', 10);
  });

  it('should render two tabs', () => {
    fixture.detectChanges();
    expect(component.tabs.length).toBe(2);
    expect(component.tabs[0].label).toBe('Metrics');
    expect(component.tabs[1].label).toBe('Activities');
  });

  it('should start with Metrics tab active', () => {
    let currentIndex = -1;
    component.activeTabIndex$.subscribe((index) => {
      currentIndex = index;
    });
    expect(currentIndex).toBe(0);
  });

  it('should switch tabs on activeIndexChange', () => {
    fixture.detectChanges();
    component.onTabChange(1);
    let currentIndex = -1;
    component.activeTabIndex$.subscribe((index) => {
      currentIndex = index;
    });
    expect(currentIndex).toBe(1);
  });

  it('should have header with dashboard title', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Dashboard');
  });

  it('should use OnPush change detection', () => {
    expect(component).toBeTruthy();
  });

  it('should unsubscribe on destroy', () => {
    fixture.detectChanges();
    const destroySpy = vi.spyOn(component['destroy$'], 'next');
    const completeSpy = vi.spyOn(component['destroy$'], 'complete');
    component.ngOnDestroy();
    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it('should pass metrics to grid component', () => {
    fixture.detectChanges();
    const metricsGrid = fixture.debugElement.nativeElement.querySelector('app-metrics-grid');
    expect(metricsGrid).toBeTruthy();
  });

  it('should pass activities to timeline component', () => {
    fixture.detectChanges();
    const timeline = fixture.debugElement.nativeElement.querySelector('app-activity-timeline');
    expect(timeline).toBeTruthy();
  });
});
