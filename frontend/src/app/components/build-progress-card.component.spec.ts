import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BuildProgressCardComponent } from './build-progress-card.component';
import { BuildStatusService } from '../api/build-status.service';
// Import Apollo mock (vitest alias replaces apollo-angular with apollo.mock.ts)
import { Apollo } from 'apollo-angular';
import { BuildStatus } from '../api/generated/graphql';
import { vi } from 'vitest';

// Mock BuildStatusService to avoid Apollo subscription issues
const mockBuildStatusService = {
  subscribeToBuildStatus: () => {},
  getBufferedUpdates: () => ({ pipe: () => ({ subscribe: () => {} }) }),
  disconnect: () => {},
  disconnectAll: () => {},
  getConnectionHealth: () => ({ pipe: () => ({ subscribe: () => {} }) }),
  buildStatus$: { subscribe: () => {} },
};

describe('BuildProgressCardComponent', () => {
  let component: BuildProgressCardComponent;
  let fixture: ComponentFixture<BuildProgressCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuildProgressCardComponent],
      providers: [
        // Provide mock BuildStatusService instead of real one
        { provide: BuildStatusService, useValue: mockBuildStatusService },
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
    it('should have getDefaultStatus method', () => {
      const comp = component as any;
      expect(typeof comp.getDefaultStatus).toBe('function');
    });

    it('should return default status structure', () => {
      const comp = component as any;
      const defaultStatus = comp.getDefaultStatus();
      expect(defaultStatus).toHaveProperty('status');
      expect(defaultStatus).toHaveProperty('progress');
      expect(defaultStatus).toHaveProperty('testsPassed');
      expect(defaultStatus).toHaveProperty('testsTotal');
      expect(defaultStatus).toHaveProperty('duration');
      expect(defaultStatus).toHaveProperty('timestamp');
    });

    it('should have default status values', () => {
      const comp = component as any;
      const status = comp.getDefaultStatus();
      expect(status.status).toBe('Starting');
      expect(status.progress).toBe(0);
      expect(status.testsPassed).toBe(0);
      expect(status.testsTotal).toBe(0);
      expect(status.duration).toBe(0);
    });

    it('should have mapStatus method', () => {
      const comp = component as any;
      expect(typeof comp.mapStatus).toBe('function');
    });

    it('should map BuildStatus.Pending to Starting', () => {
      const comp = component as any;
      expect(comp.mapStatus(BuildStatus.Pending)).toBe('Starting');
    });

    it('should map BuildStatus.Running to In Progress', () => {
      const comp = component as any;
      expect(comp.mapStatus(BuildStatus.Running)).toBe('In Progress');
    });

    it('should map BuildStatus.Complete to Complete', () => {
      const comp = component as any;
      expect(comp.mapStatus(BuildStatus.Complete)).toBe('Complete');
    });

    it('should map BuildStatus.Failed to Failed', () => {
      const comp = component as any;
      expect(comp.mapStatus(BuildStatus.Failed)).toBe('Failed');
    });

    it('should have mapUpdatesToDisplay method', () => {
      const comp = component as any;
      expect(typeof comp.mapUpdatesToDisplay).toBe('function');
    });

    it('should handle empty updates array', () => {
      const comp = component as any;
      const result = comp.mapUpdatesToDisplay([]);
      expect(result.status).toBe('Starting');
    });

    it('should map single update', () => {
      const comp = component as any;
      const updates = [
        {
          buildId: 'build-1',
          oldStatus: BuildStatus.Pending,
          newStatus: BuildStatus.Running,
          timestamp: '2024-01-01T00:00:00Z'
        }
      ];
      const result = comp.mapUpdatesToDisplay(updates);
      expect(result.status).toBe('In Progress');
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should use latest update in array', () => {
      const comp = component as any;
      const updates = [
        {
          buildId: 'build-1',
          oldStatus: BuildStatus.Pending,
          newStatus: BuildStatus.Running,
          timestamp: '2024-01-01T00:00:00Z'
        },
        {
          buildId: 'build-1',
          oldStatus: BuildStatus.Running,
          newStatus: BuildStatus.Complete,
          timestamp: '2024-01-01T00:01:00Z'
        }
      ];
      const result = comp.mapUpdatesToDisplay(updates);
      expect(result.status).toBe('Complete');
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

  // Dependency injection tests
  describe('Dependencies', () => {
    it('should inject BuildStatusService', () => {
      const comp = component as any;
      expect(comp.buildStatusService).toBeDefined();
    });

    it('should inject BuildStatusService with expected methods', () => {
      const comp = component as any;
      expect(typeof comp.buildStatusService.subscribeToBuildStatus).toBe('function');
      expect(typeof comp.buildStatusService.getBufferedUpdates).toBe('function');
      expect(typeof comp.buildStatusService.disconnect).toBe('function');
    });
  });
});
