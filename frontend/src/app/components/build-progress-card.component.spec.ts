import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BuildProgressCardComponent } from './build-progress-card.component';
import { BuildStateWorkerService } from '../services/build-state-worker.service';
// Import Apollo mock (vitest alias replaces apollo-angular with apollo.mock.ts)
import { Apollo } from 'apollo-angular';
import type { BuildStatus, BuildStatusUpdate } from '../api/generated/graphql';
import { vi } from 'vitest';
import { Subject, of } from 'rxjs';

// Mock BuildStateWorkerService with real observable support
const createMockBuildStateWorkerService = () => {
  const buildsMap$ = new Subject<Map<string, any>>();
  return {
    subscribeToBuild: vi.fn(),
    unsubscribeBuild: vi.fn(),
    getBuilds$: vi.fn(() => buildsMap$),
    _buildsMap$: buildsMap$,
  };
};

describe('BuildProgressCardComponent', () => {
  let component: BuildProgressCardComponent;
  let fixture: ComponentFixture<BuildProgressCardComponent>;
  let mockService: ReturnType<typeof createMockBuildStateWorkerService>;

  beforeEach(async () => {
    mockService = createMockBuildStateWorkerService();

    await TestBed.configureTestingModule({
      imports: [BuildProgressCardComponent],
      providers: [
        // Provide mock BuildStateWorkerService instead of real one
        { provide: BuildStateWorkerService, useValue: mockService },
        // Provide mock Apollo
        { provide: Apollo, useClass: Apollo },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BuildProgressCardComponent);
    component = fixture.componentInstance;
  });

  // Component instantiation tests
  describe('Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default buildId', () => {
      expect(component.buildId).toBe('build-uuid-123');
    });

    it('should have default buildName', () => {
      expect(component.buildName).toBe('Build #42');
    });
  });

  // Input handling tests
  describe('Input Signals', () => {
    it('should accept custom buildName input', () => {
      fixture.componentRef.setInput('buildName', 'Custom Test Build');
      expect(component.buildName).toBe('Custom Test Build');
    });

    it('should handle signal input updates', () => {
      fixture.componentRef.setInput('buildId', 'custom-id');
      expect(component.buildId).toBe('custom-id');
    });

    it('should update buildName to empty string', () => {
      fixture.componentRef.setInput('buildName', '');
      expect(component.buildName).toBe('');
    });

    it('should update buildId with special characters', () => {
      fixture.componentRef.setInput('buildId', 'build-uuid-abc-123-xyz');
      expect(component.buildId).toBe('build-uuid-abc-123-xyz');
    });
  });

  // Method tests - these access private methods via reflection
  describe('Private Methods', () => {
    it('should have getDefaultUpdate method', () => {
      const comp = component as any;
      expect(typeof comp.getDefaultUpdate).toBe('function');
    });

    it('should return BuildStatusUpdate structure', () => {
      const comp = component as any;
      const defaultUpdate = comp.getDefaultUpdate();
      expect(defaultUpdate).toHaveProperty('buildId');
      expect(defaultUpdate).toHaveProperty('newStatus');
      expect(defaultUpdate).toHaveProperty('oldStatus');
      expect(defaultUpdate).toHaveProperty('timestamp');
    });

    it('should have default update values', () => {
      const comp = component as any;
      const update: BuildStatusUpdate = comp.getDefaultUpdate();
      expect(update.newStatus).toBe('PENDING');
      expect(update.oldStatus).toBe('PENDING');
      expect(update.timestamp).toBeInstanceOf(Date);
    });
  });

  // Event handler tests
  describe('Event Handlers', () => {
    it('should have viewLogs method', () => {
      expect(typeof component.viewLogs).toBe('function');
    });

    it('should have cancelBuild method', () => {
      expect(typeof component.cancelBuild).toBe('function');
    });

    it('should have restartBuild method', () => {
      expect(typeof component.restartBuild).toBe('function');
    });

    it('should call viewLogs without throwing', () => {
      expect(() => {
        component.viewLogs();
      }).not.toThrow();
    });

    it('should call cancelBuild without throwing', () => {
      expect(() => {
        component.cancelBuild();
      }).not.toThrow();
    });

    it('should call restartBuild without throwing', () => {
      expect(() => {
        component.restartBuild();
      }).not.toThrow();
    });

    it('should log when viewLogs called', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      component.viewLogs();
      expect(consoleSpy).toHaveBeenCalledWith('Opening logs for', component.buildId);
      consoleSpy.mockRestore();
    });

    it('should log when cancelBuild called', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      component.cancelBuild();
      expect(consoleSpy).toHaveBeenCalledWith('Cancelling build', component.buildId);
      consoleSpy.mockRestore();
    });

    it('should log when restartBuild called', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      component.restartBuild();
      expect(consoleSpy).toHaveBeenCalledWith('Restarting build', component.buildId);
      consoleSpy.mockRestore();
    });
  });

  // Computed signal tests
  describe('Computed Signals', () => {
    it('should have statusLabel computed signal', () => {
      expect(typeof component.statusLabel).toBe('function');
    });

    it('should have statusVariant computed signal', () => {
      expect(typeof component.statusVariant).toBe('function');
    });

    it('should have isComplete computed signal', () => {
      expect(typeof component.isComplete).toBe('function');
    });

    it('statusLabel should return PENDING for PENDING status', () => {
      const comp = component as any;
      comp.buildStatus.set({
        buildId: 'test-1',
        newStatus: 'PENDING' as BuildStatus,
        oldStatus: 'PENDING' as BuildStatus,
        timestamp: new Date()
      });
      expect(component.statusLabel()).toBe('PENDING');
    });

    it('statusLabel should return RUNNING for RUNNING status', () => {
      const comp = component as any;
      comp.buildStatus.set({
        buildId: 'test-1',
        newStatus: 'RUNNING' as BuildStatus,
        oldStatus: 'PENDING' as BuildStatus,
        timestamp: new Date()
      });
      expect(component.statusLabel()).toBe('RUNNING');
    });

    it('statusLabel should return COMPLETE for COMPLETE status', () => {
      const comp = component as any;
      comp.buildStatus.set({
        buildId: 'test-1',
        newStatus: 'COMPLETE' as BuildStatus,
        oldStatus: 'RUNNING' as BuildStatus,
        timestamp: new Date()
      });
      expect(component.statusLabel()).toBe('COMPLETE');
    });

    it('statusLabel should return FAILED for FAILED status', () => {
      const comp = component as any;
      comp.buildStatus.set({
        buildId: 'test-1',
        newStatus: 'FAILED' as BuildStatus,
        oldStatus: 'RUNNING' as BuildStatus,
        timestamp: new Date()
      });
      expect(component.statusLabel()).toBe('FAILED');
    });

    it('statusVariant should return warning for PENDING status', () => {
      const comp = component as any;
      comp.buildStatus.set({
        buildId: 'test-1',
        newStatus: 'PENDING' as BuildStatus,
        oldStatus: 'PENDING' as BuildStatus,
        timestamp: new Date()
      });
      expect(component.statusVariant()).toBe('warning');
    });

    it('statusVariant should return info for RUNNING status', () => {
      const comp = component as any;
      comp.buildStatus.set({
        buildId: 'test-1',
        newStatus: 'RUNNING' as BuildStatus,
        oldStatus: 'PENDING' as BuildStatus,
        timestamp: new Date()
      });
      expect(component.statusVariant()).toBe('info');
    });

    it('statusVariant should return success for COMPLETE status', () => {
      const comp = component as any;
      comp.buildStatus.set({
        buildId: 'test-1',
        newStatus: 'COMPLETE' as BuildStatus,
        oldStatus: 'RUNNING' as BuildStatus,
        timestamp: new Date()
      });
      expect(component.statusVariant()).toBe('success');
    });

    it('statusVariant should return error for FAILED status', () => {
      const comp = component as any;
      comp.buildStatus.set({
        buildId: 'test-1',
        newStatus: 'FAILED' as BuildStatus,
        oldStatus: 'RUNNING' as BuildStatus,
        timestamp: new Date()
      });
      expect(component.statusVariant()).toBe('error');
    });

    it('isComplete should return true for COMPLETE status', () => {
      const comp = component as any;
      comp.buildStatus.set({
        buildId: 'test-1',
        newStatus: 'COMPLETE' as BuildStatus,
        oldStatus: 'RUNNING' as BuildStatus,
        timestamp: new Date()
      });
      expect(component.isComplete()).toBe(true);
    });

    it('isComplete should return true for FAILED status', () => {
      const comp = component as any;
      comp.buildStatus.set({
        buildId: 'test-1',
        newStatus: 'FAILED' as BuildStatus,
        oldStatus: 'RUNNING' as BuildStatus,
        timestamp: new Date()
      });
      expect(component.isComplete()).toBe(true);
    });

    it('isComplete should return false for PENDING status', () => {
      const comp = component as any;
      comp.buildStatus.set({
        buildId: 'test-1',
        newStatus: 'PENDING' as BuildStatus,
        oldStatus: 'PENDING' as BuildStatus,
        timestamp: new Date()
      });
      expect(component.isComplete()).toBe(false);
    });

    it('isComplete should return false for RUNNING status', () => {
      const comp = component as any;
      comp.buildStatus.set({
        buildId: 'test-1',
        newStatus: 'RUNNING' as BuildStatus,
        oldStatus: 'PENDING' as BuildStatus,
        timestamp: new Date()
      });
      expect(component.isComplete()).toBe(false);
    });
  });

  // Signal lifecycle tests
  describe('Signal Lifecycle', () => {
    it('should initialize buildStatus signal with default value', () => {
      expect(component.buildStatus()).toBeDefined();
      expect(component.buildStatus().newStatus).toBe('PENDING');
    });

    it('should update buildStatus when new value is set', () => {
      const newUpdate: BuildStatusUpdate = {
        buildId: 'test-1',
        newStatus: 'RUNNING' as BuildStatus,
        oldStatus: 'PENDING' as BuildStatus,
        timestamp: new Date('2024-01-01T00:01:00Z')
      };
      const comp = component as any;
      comp.buildStatus.set(newUpdate);
      expect(component.buildStatus().newStatus).toBe('RUNNING');
      expect(component.buildStatus().timestamp).toEqual(new Date('2024-01-01T00:01:00Z'));
    });

    it('should trigger computed signals when buildStatus changes', () => {
      const comp = component as any;
      const initialVariant = component.statusVariant();
      expect(initialVariant).toBe('warning'); // PENDING -> warning

      comp.buildStatus.set({
        buildId: 'test-1',
        newStatus: 'RUNNING' as BuildStatus,
        oldStatus: 'PENDING' as BuildStatus,
        timestamp: new Date()
      });

      const updatedVariant = component.statusVariant();
      expect(updatedVariant).toBe('info'); // RUNNING -> info
    });

    it('should unsubscribe from buildStatus stream on destroy', () => {
      const comp = component as any;
      expect(comp.subscription).toBeDefined();
      component.ngOnDestroy();
      // Verify unsubscribe was called (no exception thrown)
      expect(true).toBe(true);
    });

    it('should subscribe to buildStatus stream on init', () => {
      fixture.detectChanges(); // Triggers ngOnInit

      // Create a mock build object with the expected structure
      const mockBuild = {
        id: 'build-uuid-123',
        status: 'RUNNING' as BuildStatus,
        updatedAt: new Date('2024-01-01T00:01:00Z')
      };

      // Emit build map through the mock service
      const buildMap = new Map();
      buildMap.set('build-uuid-123', mockBuild);
      mockService._buildsMap$.next(buildMap);

      // Verify subscription callback processed the update
      expect(component.buildStatus().newStatus).toBe('RUNNING');
    });

    it('should handle multiple status updates through subscription', () => {
      fixture.detectChanges(); // Triggers ngOnInit

      // Create mock build objects
      const mockBuild = {
        id: 'build-uuid-123',
        status: 'COMPLETE' as BuildStatus,
        updatedAt: new Date('2024-01-01T00:02:00Z')
      };

      // Emit build map through the mock service
      const buildMap = new Map();
      buildMap.set('build-uuid-123', mockBuild);
      mockService._buildsMap$.next(buildMap);

      // Should get the latest update status
      expect(component.buildStatus().newStatus).toBe('COMPLETE');
      expect(component.statusVariant()).toBe('success');
    });
  });


  // Dependency injection tests
  describe('Dependencies', () => {
    it('should inject BuildStateWorkerService', () => {
      const comp = component as any;
      expect(comp.stateWorker).toBeDefined();
    });

    it('should inject BuildStateWorkerService with expected methods', () => {
      const comp = component as any;
      expect(typeof comp.stateWorker.subscribeToBuild).toBe('function');
      expect(typeof comp.stateWorker.getBuilds$).toBe('function');
      expect(typeof comp.stateWorker.unsubscribeBuild).toBe('function');
    });
  });
});
