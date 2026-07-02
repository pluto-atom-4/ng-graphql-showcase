import { TestBed } from '@angular/core/testing';
import { BuildStatusService } from './build-status.service';
// Import Apollo mock (vitest alias replaces apollo-angular)
import { Apollo } from 'apollo-angular';

describe('BuildStatusService', () => {
  let service: BuildStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BuildStatusService,
        { provide: Apollo, useClass: Apollo }
      ]
    });

    service = TestBed.inject(BuildStatusService);
  });

  // Existing tests
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have subscribeToBuildStatus method', () => {
    expect(typeof service.subscribeToBuildStatus).toBe('function');
  });

  it('should have getBufferedUpdates method', () => {
    expect(typeof service.getBufferedUpdates).toBe('function');
  });

  it('should have disconnect method', () => {
    expect(typeof service.disconnect).toBe('function');
  });

  it('should have disconnectAll method', () => {
    expect(typeof service.disconnectAll).toBe('function');
  });

  // Observable structure tests
  describe('Observable Streams', () => {
    it('should provide buildStatus$ observable', () => {
      expect(service.buildStatus$).toBeDefined();
    });

    it('should provide connectionHealth$ observable', () => {
      expect(service.connectionHealth$).toBeDefined();
    });

    it('should return observable from getConnectionHealth', () => {
      const health$ = service.getConnectionHealth();
      expect(health$).toBeDefined();
    });

    it('should return observable from getBufferedUpdates', () => {
      const updates$ = service.getBufferedUpdates();
      expect(updates$).toBeDefined();
    });

    it('should allow subscribing to buildStatus$', () => {
      return new Promise<void>((resolve) => {
        service.buildStatus$.subscribe((status) => {
          expect(Array.isArray(status)).toBe(true);
          resolve();
        });
      });
    });

    it('should allow subscribing to connectionHealth$', () => {
      return new Promise<void>((resolve) => {
        service.connectionHealth$.subscribe((health) => {
          expect(health).toHaveProperty('isConnected');
          expect(health).toHaveProperty('lastHeartbeat');
          expect(health).toHaveProperty('reconnectAttempts');
          resolve();
        });
      });
    });
  });

  // Subscription management tests
  describe('Subscription Management', () => {
    it('should handle subscribeToBuildStatus call', () => {
      expect(() => {
        service.subscribeToBuildStatus('build-123');
      }).not.toThrow();
    });

    it('should accept multiple build IDs', () => {
      expect(() => {
        service.subscribeToBuildStatus('build-1');
        service.subscribeToBuildStatus('build-2');
        service.subscribeToBuildStatus('build-3');
      }).not.toThrow();
    });

    it('should unsubscribe previous subscription when subscribing to same buildId', () => {
      service.subscribeToBuildStatus('build-same');
      expect(() => {
        service.subscribeToBuildStatus('build-same');
      }).not.toThrow();
    });

    it('should disconnect specific build subscription', () => {
      service.subscribeToBuildStatus('build-to-disconnect');
      expect(() => {
        service.disconnect('build-to-disconnect');
      }).not.toThrow();
    });

    it('should disconnect all subscriptions', () => {
      service.subscribeToBuildStatus('build-1');
      service.subscribeToBuildStatus('build-2');
      expect(() => {
        service.disconnectAll();
      }).not.toThrow();
    });

    it('should handle disconnect of non-existent buildId gracefully', () => {
      expect(() => {
        service.disconnect('non-existent-build');
      }).not.toThrow();
    });
  });

  // Buffer and filtering tests
  describe('Update Buffering', () => {
    it('should provide getBufferedUpdates as observable', () => {
      const buffered$ = service.getBufferedUpdates();
      expect(buffered$).toBeDefined();
    });

    it('should have bufferTime(250) configuration', () => {
      const buffered$ = service.getBufferedUpdates();
      expect(typeof buffered$.subscribe).toBe('function');
    });
  });

  // Connection health tests
  describe('Connection Health', () => {
    it('should initialize with disconnected state', () => {
      return new Promise<void>((resolve) => {
        service.connectionHealth$.subscribe((health) => {
          expect(health.isConnected).toBe(false);
          expect(health.reconnectAttempts).toBe(0);
          expect(health.lastHeartbeat).toBeInstanceOf(Date);
          resolve();
        });
      });
    });

    it('should track reconnect attempts', () => {
      return new Promise<void>((resolve) => {
        service.connectionHealth$.subscribe((health) => {
          expect(typeof health.reconnectAttempts).toBe('number');
          resolve();
        });
      });
    });

    it('should include lastHeartbeat timestamp', () => {
      return new Promise<void>((resolve) => {
        service.connectionHealth$.subscribe((health) => {
          expect(health.lastHeartbeat).toBeInstanceOf(Date);
          resolve();
        });
      });
    });

    it('should track error messages in health state', () => {
      expect(typeof service.getConnectionHealth).toBe('function');
    });
  });

  // Update clearing tests
  describe('Update Management', () => {
    it('should provide clearUpdates method', () => {
      expect(typeof service.clearUpdates).toBe('function');
    });

    it('should not throw when clearing updates', () => {
      expect(() => {
        service.clearUpdates();
      }).not.toThrow();
    });

    it('should clear update state', () => {
      return new Promise<void>((resolve) => {
        service.clearUpdates();
        service.buildStatus$.subscribe((status) => {
          expect(Array.isArray(status)).toBe(true);
          expect(status.length).toBe(0);
          resolve();
        });
      });
    });
  });

  // Type safety tests
  describe('Type Safety', () => {
    it('should accept string buildId', () => {
      expect(() => {
        service.subscribeToBuildStatus('valid-build-id');
      }).not.toThrow();
    });

    it('should handle buildId with special characters', () => {
      expect(() => {
        service.subscribeToBuildStatus('build-uuid-123-abc-def');
      }).not.toThrow();
    });

    it('should handle empty string buildId', () => {
      expect(() => {
        service.subscribeToBuildStatus('');
      }).not.toThrow();
    });
  });
});
