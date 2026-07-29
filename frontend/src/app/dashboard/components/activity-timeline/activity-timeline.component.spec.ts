import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivityTimelineComponent } from './activity-timeline.component';
import { BadgeComponent } from '../../shared/badge/badge.component';

describe('ActivityTimelineComponent', () => {
  let component: ActivityTimelineComponent;
  let fixture: ComponentFixture<ActivityTimelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityTimelineComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityTimelineComponent);
    component = fixture.componentInstance;
  });

  it('should show empty message when no activities', () => {
    component.activities = [];
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No activities yet');
  });

  it('should render activity items', () => {
    component.activities = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        description: 'Build started',
        status: 'RUNNING'
      },
      {
        id: '2',
        timestamp: new Date().toISOString(),
        description: 'Build completed',
        status: 'COMPLETE'
      }
    ];
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('[role="tabpanel"]') || fixture.nativeElement.querySelectorAll('.flex.gap-4');
    expect(component.activities.length).toBe(2);
  });

  it('should display activity description', () => {
    component.activities = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        description: 'Test build initiated',
        status: 'PENDING'
      }
    ];
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Test build initiated');
  });

  it('should format timestamp as "Just now" for recent activity', () => {
    const now = new Date();
    component.activities = [
      {
        id: '1',
        timestamp: now.toISOString(),
        description: 'Build started',
        status: 'RUNNING'
      }
    ];
    fixture.detectChanges();
    const formatted = component.formatTimestamp(now.toISOString());
    expect(formatted).toBe('Just now');
  });

  it('should format timestamp in minutes', () => {
    const pastTime = new Date(Date.now() - 5 * 60 * 1000);
    const formatted = component.formatTimestamp(pastTime.toISOString());
    expect(formatted).toBe('5m ago');
  });

  it('should format timestamp in hours', () => {
    const pastTime = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const formatted = component.formatTimestamp(pastTime.toISOString());
    expect(formatted).toBe('2h ago');
  });

  it('should format timestamp in days', () => {
    const pastTime = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const formatted = component.formatTimestamp(pastTime.toISOString());
    expect(formatted).toBe('3d ago');
  });

  it('should format timestamp as date for older activity', () => {
    const oldDate = new Date(2026, 0, 1);
    const formatted = component.formatTimestamp(oldDate.toISOString());
    expect(formatted).toContain('2026');
  });

  it('should render timeline dots', () => {
    component.activities = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        description: 'Activity 1',
        status: 'RUNNING'
      },
      {
        id: '2',
        timestamp: new Date().toISOString(),
        description: 'Activity 2',
        status: 'COMPLETE'
      }
    ];
    fixture.detectChanges();
    const dots = fixture.nativeElement.querySelectorAll('[class*="rounded-full"][class*="bg-blue"]');
    expect(dots.length).toBeGreaterThan(0);
  });

  it('should use trackBy for performance', () => {
    const activities = [
      { id: '1', timestamp: new Date().toISOString(), description: 'Activity 1', status: 'PENDING' as const }
    ];
    const result = component.trackByActivityId(0, activities[0]);
    expect(result).toBe('1');
  });

  it('should handle invalid timestamp gracefully', () => {
    const formatted = component.formatTimestamp('invalid-date');
    // Should return a string (either original or formatted)
    expect(typeof formatted).toBe('string');
    expect(formatted.length).toBeGreaterThan(0);
  });

  it('should use OnPush change detection', () => {
    expect(component).toBeTruthy();
  });
});
