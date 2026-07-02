import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BuildProgressCardComponent } from './build-progress-card.component';
import { BuildStatusService } from '../api/build-status.service';
import { BuildStatus } from '../api/generated/graphql';

describe('BuildProgressCardComponent', () => {
  let component: BuildProgressCardComponent;
  let fixture: ComponentFixture<BuildProgressCardComponent>;

  const createComponent = (updates: any[] = []) => {
    const mockService = {
      subscribeToBuildStatus: () => {},
      getBufferedUpdates: () => of(updates),
      disconnect: () => {},
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [BuildProgressCardComponent],
      providers: [{ provide: BuildStatusService, useValue: mockService }],
    });

    fixture = TestBed.createComponent(BuildProgressCardComponent);
    component = fixture.componentInstance;
  };

  beforeEach(() => {
    createComponent([
      {
        buildId: 'build-1',
        oldStatus: BuildStatus.Pending,
        newStatus: BuildStatus.Running,
        timestamp: new Date(),
      },
    ]);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Subscription Initialization', () => {
    it('should initialize with default buildId', () => {
      fixture.detectChanges();
      expect(component.buildId).toBe('build-uuid-123');
    });

    it('should accept custom buildId', () => {
      component.buildId = 'custom-build-id';
      expect(component.buildId).toBe('custom-build-id');
    });

    it('should render component after init', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.buildStatus).toBeDefined();
    });
  });

  describe('Status Mapping', () => {
    it('should map Running status to "In Progress"', () => {
      fixture.detectChanges();
      expect(component.buildStatus().status).toBe('In Progress');
    });

    it('should map Complete status', () => {
      createComponent([
        {
          buildId: 'build-1',
          oldStatus: BuildStatus.Running,
          newStatus: BuildStatus.Complete,
          timestamp: new Date(),
        },
      ]);
      fixture.detectChanges();
      expect(component.buildStatus().status).toBe('Complete');
    });

    it('should map Failed status', () => {
      createComponent([
        {
          buildId: 'build-1',
          oldStatus: BuildStatus.Running,
          newStatus: BuildStatus.Failed,
          timestamp: new Date(),
        },
      ]);
      fixture.detectChanges();
      expect(component.buildStatus().status).toBe('Failed');
    });

    it('should map Pending status to "Starting"', () => {
      createComponent([
        {
          buildId: 'build-1',
          oldStatus: BuildStatus.Pending,
          newStatus: BuildStatus.Pending,
          timestamp: new Date(),
        },
      ]);
      fixture.detectChanges();
      expect(component.buildStatus().status).toBe('Starting');
    });

    it('should preserve timestamp from subscription', () => {
      const testDate = new Date('2026-07-01T12:00:00Z');
      createComponent([
        {
          buildId: 'build-1',
          oldStatus: BuildStatus.Pending,
          newStatus: BuildStatus.Running,
          timestamp: testDate,
        },
      ]);
      fixture.detectChanges();
      expect(component.buildStatus().timestamp.getTime()).toBe(
        testDate.getTime()
      );
    });

    it('should maintain default values for display fields', () => {
      fixture.detectChanges();
      const status = component.buildStatus();
      expect(status.progress).toBe(0);
      expect(status.testsPassed).toBe(0);
      expect(status.testsTotal).toBe(0);
      expect(status.duration).toBe(0);
    });
  });

  describe('Computed Signals', () => {
    it('should compute success variant for Complete status', () => {
      createComponent([
        {
          buildId: 'build-1',
          oldStatus: BuildStatus.Running,
          newStatus: BuildStatus.Complete,
          timestamp: new Date(),
        },
      ]);
      fixture.detectChanges();
      expect(component.statusVariant()).toBe('success');
    });

    it('should compute info variant for In Progress status', () => {
      fixture.detectChanges();
      expect(component.statusVariant()).toBe('info');
    });

    it('should compute error variant for Failed status', () => {
      createComponent([
        {
          buildId: 'build-1',
          oldStatus: BuildStatus.Running,
          newStatus: BuildStatus.Failed,
          timestamp: new Date(),
        },
      ]);
      fixture.detectChanges();
      expect(component.statusVariant()).toBe('error');
    });

    it('should compute isComplete as false for in-progress builds', () => {
      fixture.detectChanges();
      expect(component.isComplete()).toBe(false);
    });

    it('should compute isComplete as true for completed builds', () => {
      createComponent([
        {
          buildId: 'build-1',
          oldStatus: BuildStatus.Running,
          newStatus: BuildStatus.Complete,
          timestamp: new Date(),
        },
      ]);
      fixture.detectChanges();
      expect(component.isComplete()).toBe(true);
    });

    it('should compute isComplete as true for failed builds', () => {
      createComponent([
        {
          buildId: 'build-1',
          oldStatus: BuildStatus.Running,
          newStatus: BuildStatus.Failed,
          timestamp: new Date(),
        },
      ]);
      fixture.detectChanges();
      expect(component.isComplete()).toBe(true);
    });
  });

  describe('Input Properties', () => {
    it('should accept buildName input', () => {
      component.buildName = 'Custom Build';
      expect(component.buildName).toBe('Custom Build');
    });

    it('should accept buildId input', () => {
      component.buildId = 'custom-id';
      expect(component.buildId).toBe('custom-id');
    });

    it('should have default buildName', () => {
      expect(component.buildName).toBe('Build #42');
    });

    it('should have default buildId', () => {
      expect(component.buildId).toBe('build-uuid-123');
    });
  });

  describe('Empty/Default State', () => {
    it('should render default status when no updates', () => {
      createComponent([]);
      fixture.detectChanges();
      expect(component.buildStatus().status).toBe('Starting');
      expect(component.buildStatus().progress).toBe(0);
    });

    it('should handle empty update array gracefully', () => {
      createComponent([]);
      fixture.detectChanges();
      const status = component.buildStatus();
      expect(status).toBeTruthy();
      expect(status.status).toBeDefined();
      expect(status.timestamp).toBeDefined();
    });
  });


  describe('Methods', () => {
    it('should have viewLogs method', () => {
      expect(() => component.viewLogs()).not.toThrow();
    });

    it('should have cancelBuild method', () => {
      expect(() => component.cancelBuild()).not.toThrow();
    });

    it('should have restartBuild method', () => {
      expect(() => component.restartBuild()).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should map subscription status and compute variant correctly', () => {
      createComponent([
        {
          buildId: 'build-1',
          oldStatus: BuildStatus.Pending,
          newStatus: BuildStatus.Complete,
          timestamp: new Date(),
        },
      ]);
      fixture.detectChanges();

      expect(component.buildStatus().status).toBe('Complete');
      expect(component.statusVariant()).toBe('success');
      expect(component.isComplete()).toBe(true);
    });

    it('all statuses should be handled correctly', () => {
      const statusMap = [
        { input: BuildStatus.Pending, expectedDisplay: 'Starting', expectedVariant: 'info' },
        { input: BuildStatus.Running, expectedDisplay: 'In Progress', expectedVariant: 'info' },
        { input: BuildStatus.Complete, expectedDisplay: 'Complete', expectedVariant: 'success' },
        { input: BuildStatus.Failed, expectedDisplay: 'Failed', expectedVariant: 'error' },
      ];

      statusMap.forEach(({ input, expectedDisplay, expectedVariant }) => {
        createComponent([
          {
            buildId: 'build-1',
            oldStatus: BuildStatus.Pending,
            newStatus: input,
            timestamp: new Date(),
          },
        ]);
        fixture.detectChanges();

        expect(component.buildStatus().status).toBe(expectedDisplay);
        expect(component.statusVariant()).toBe(expectedVariant);
      });
    });
  });
});
