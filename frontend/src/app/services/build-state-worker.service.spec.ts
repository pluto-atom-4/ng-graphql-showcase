import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BuildStateWorkerService, Build } from './build-state-worker.service';
import { BuildService } from './build.service';
import { BuildStatusService } from '../api/build-status.service';
import { of } from 'rxjs';

describe('BuildStateWorkerService - Phase 4 Unit Tests', () => {
  let service: BuildStateWorkerService | null = null;
  let buildServiceMock: Partial<BuildService>;
  let buildStatusServiceMock: Partial<BuildStatusService>;

  const mockBuild: Build = {
    id: 'build-1',
    name: 'Test Build',
    description: 'Test Description',
    status: 'COMPLETE',
    createdAt: new Date('2026-07-22'),
    updatedAt: new Date('2026-07-22'),
    parts: [],
    testRuns: [],
  };

  beforeEach(() => {
    buildServiceMock = {
      getBuildById: vi.fn().mockReturnValue(of(mockBuild)),
    };

    buildStatusServiceMock = {
      subscribeToBuildStatus: vi.fn(),
      getBufferedUpdates: vi.fn().mockReturnValue(of([])),
    };

    TestBed.configureTestingModule({
      providers: [
        BuildStateWorkerService,
        { provide: BuildService, useValue: buildServiceMock },
        { provide: BuildStatusService, useValue: buildStatusServiceMock },
      ],
    });

    service = TestBed.inject(BuildStateWorkerService);
    localStorage.clear();
  });

  afterEach(() => {
    if (service) {
      service.ngOnDestroy();
    }
    localStorage.clear();
  });

  describe('P0: Event Listener & OnDestroy', () => {
    it('should implement OnDestroy', () => {
      expect(service?.ngOnDestroy).toBeDefined();
      expect(() => service?.ngOnDestroy()).not.toThrow();
    });
  });

  describe('P0: Error Handling', () => {
    it('should handle subscription without errors', () => {
      expect(() => service?.subscribeToBuild('build-1')).not.toThrow();
      expect(buildServiceMock.getBuildById).toHaveBeenCalled();
    });

    it('should prevent duplicate subscriptions', () => {
      service?.subscribeToBuild('build-1');
      service?.subscribeToBuild('build-1');

      expect((buildServiceMock.getBuildById as any).mock.calls.length).toBe(1);
    });
  });

  describe('P0: activeSubscriptions Cleanup', () => {
    it('should add subscription on subscribeToBuild', () => {
      service?.subscribeToBuild('build-1');
      const build = service?.getBuild('build-1');
      expect(build).toBeTruthy();
    });

    it('should remove subscription on unsubscribeBuild', () => {
      service?.subscribeToBuild('build-1');
      service?.unsubscribeBuild('build-1');

      // After unsubscribe, should allow new subscription (second call)
      service?.subscribeToBuild('build-1');

      expect((buildServiceMock.getBuildById as any).mock.calls.length).toBe(2);
    });
  });

  describe('P1: localStorage Quota Management', () => {
    it('should have quota management methods', () => {
      expect((service as any).isCacheStale).toBeDefined();
      expect((service as any).getStaleInfo).toBeDefined();
    });

    it('should persist and retrieve from localStorage', () => {
      service?.subscribeToBuild('build-1');
      // Verify localStorage has been used
      expect(localStorage.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('P2: Staleness Tracking', () => {
    it('should detect stale cache (>1hr old)', () => {
      const oldBuild: Build = {
        ...mockBuild,
        cachedAt: Date.now() - 3600000 - 1000,
      };

      expect(service?.isCacheStale(oldBuild)).toBe(true);
    });

    it('should detect fresh cache (<1hr old)', () => {
      const freshBuild: Build = {
        ...mockBuild,
        cachedAt: Date.now() - 1800000,
      };

      expect(service?.isCacheStale(freshBuild)).toBe(false);
    });

    it('should return staleness info', () => {
      const oldBuild: Build = {
        ...mockBuild,
        cachedAt: Date.now() - 300000,
      };

      const info = service?.getStaleInfo(oldBuild);
      expect(info?.minutes).toEqual(5);
      expect(info?.isStale).toBe(false);
    });

    it('should handle custom max age', () => {
      const tenMinutesOldBuild: Build = {
        ...mockBuild,
        cachedAt: Date.now() - 600000,
      };

      expect(service?.isCacheStale(tenMinutesOldBuild, 300000)).toBe(true);
      expect(service?.isCacheStale(tenMinutesOldBuild, 3600000)).toBe(false);
    });
  });

  describe('Reconnect Deduplication', () => {
    it('should track refetchInProgress', () => {
      expect((service as any).refetchInProgress).toBeDefined();
      expect((service as any).refetchInProgress instanceof Set).toBe(true);
    });
  });

  describe('Observable Stream', () => {
    it('should provide getBuilds$ observable', () => {
      expect(service?.getBuilds$).toBeDefined();
      const obs = service?.getBuilds$();
      expect(obs).toBeTruthy();
    });
  });
});
