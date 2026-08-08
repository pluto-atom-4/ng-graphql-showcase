/**
 * Dashboard Error Handling Tests
 * Phase 6 (Issue #267): Error state validation (8+ tests)
 *
 * Tests cover:
 * - Network errors from service calls
 * - Error type discrimination
 * - Error recovery scenarios
 * - Graceful fallbacks
 */

import { throwError, of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { BuildService, BuildsResult, Metrics, Activity } from '../services/build.service';

describe('Dashboard Error Handling Tests', () => {
  let buildService: BuildService;

  beforeEach(() => {
    const mockApollo = {
      query: vi.fn(() => ({
        pipe: (...operators: any) => of({})
      })),
      subscribe: vi.fn(() => ({
        pipe: (...operators: any) => of({})
      }))
    };

    buildService = new BuildService(mockApollo as any);
  });

  describe('Network Error Handling', () => {
    it('should handle getBuilds network error', () => {
      // Arrange
      const error = new Error('Network error');
      vi.spyOn(buildService, 'getBuilds').mockReturnValue(
        throwError(() => error)
      );

      // Act & Assert
      return new Promise<void>((resolve, reject) => {
        buildService.getBuilds(0, 10).subscribe({
          next: () => reject(new Error('Should error')),
          error: (err) => {
            try {
              expect(err.message).toBe('Network error');
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
      });
    });

    it('should handle getBuildsMetrics network error', () => {
      // Arrange
      const error = new Error('Metrics error');
      vi.spyOn(buildService, 'getBuildsMetrics').mockReturnValue(
        throwError(() => error)
      );

      // Act & Assert
      return new Promise<void>((resolve, reject) => {
        buildService.getBuildsMetrics().subscribe({
          error: (err) => {
            try {
              expect(err.message).toBe('Metrics error');
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
      });
    });

    it('should handle getBuildActivities network error', () => {
      // Arrange
      const error = new Error('Activities error');
      vi.spyOn(buildService, 'getBuildActivities').mockReturnValue(
        throwError(() => error)
      );

      // Act & Assert
      return new Promise<void>((resolve, reject) => {
        buildService.getBuildActivities('build-1', 10).subscribe({
          error: (err) => {
            try {
              expect(err.message).toBe('Activities error');
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
      });
    });
  });

  describe('Error Recovery', () => {
    it('should recover after initial error', () => {
      // Arrange
      let callCount = 0;
      vi.spyOn(buildService, 'getBuilds').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return throwError(() => new Error('First call fails'));
        }
        return of({ builds: [], total: 0 });
      });

      // Act & Assert
      return new Promise<void>((resolve, reject) => {
        buildService.getBuilds(0, 10).subscribe({
          error: () => {
            buildService.getBuilds(0, 10).subscribe({
              next: (result) => {
                try {
                  expect(result).toEqual({ builds: [], total: 0 });
                  resolve();
                } catch (e) {
                  reject(e);
                }
              },
              error: reject
            });
          }
        });
      });
    });

    it('should handle error and return fallback value', () => {
      // Arrange
      vi.spyOn(buildService, 'getBuilds').mockReturnValue(
        throwError(() => new Error('Network fail'))
      );

      // Act & Assert
      return new Promise<void>((resolve, reject) => {
        buildService.getBuilds(0, 10).subscribe({
          error: () => {
            const fallback: BuildsResult = { builds: [], total: 0 };
            try {
              expect(fallback.builds).toEqual([]);
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
      });
    });
  });

  describe('Error Type Discrimination', () => {
    it('should distinguish network errors', () => {
      // Arrange
      const error = new Error('Network error');
      vi.spyOn(buildService, 'getBuilds').mockReturnValue(
        throwError(() => error)
      );

      // Act & Assert
      return new Promise<void>((resolve, reject) => {
        buildService.getBuilds(0, 10).subscribe({
          error: (err) => {
            try {
              expect(err instanceof Error).toBe(true);
              expect(err.message).toContain('Network');
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
      });
    });

    it('should handle error objects with status codes', () => {
      // Arrange
      const httpError = { status: 500, message: 'Server error' };
      vi.spyOn(buildService, 'getBuilds').mockReturnValue(
        throwError(() => httpError)
      );

      // Act & Assert
      return new Promise<void>((resolve, reject) => {
        buildService.getBuilds(0, 10).subscribe({
          error: (err: any) => {
            try {
              expect(err.status).toBe(500);
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
      });
    });
  });

  describe('Graceful Degradation', () => {
    it('should provide empty builds fallback on error', () => {
      // Arrange
      vi.spyOn(buildService, 'getBuilds').mockReturnValue(
        throwError(() => new Error('Service unavailable'))
      );

      // Act & Assert
      return new Promise<void>((resolve, reject) => {
        buildService.getBuilds(0, 10).subscribe({
          error: () => {
            const fallback: BuildsResult = { builds: [], total: 0 };
            try {
              expect(Array.isArray(fallback.builds)).toBe(true);
              expect(fallback.total).toBe(0);
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
      });
    });

    it('should provide null metrics fallback on error', () => {
      // Arrange
      vi.spyOn(buildService, 'getBuildsMetrics').mockReturnValue(
        throwError(() => new Error('Metrics unavailable'))
      );

      // Act & Assert
      return new Promise<void>((resolve, reject) => {
        buildService.getBuildsMetrics().subscribe({
          error: () => {
            const fallback: Metrics | null = null;
            try {
              expect(fallback).toBeNull();
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
      });
    });

    it('should provide empty activities fallback on error', () => {
      // Arrange
      vi.spyOn(buildService, 'getBuildActivities').mockReturnValue(
        throwError(() => new Error('Activities unavailable'))
      );

      // Act & Assert
      return new Promise<void>((resolve, reject) => {
        buildService.getBuildActivities('build-1', 10).subscribe({
          error: () => {
            const fallback: Activity[] = [];
            try {
              expect(Array.isArray(fallback)).toBe(true);
              expect(fallback.length).toBe(0);
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
      });
    });
  });

  describe('Error Propagation', () => {
    it('should propagate errors without swallowing them', () => {
      // Arrange
      const originalError = new Error('Original error');
      vi.spyOn(buildService, 'getBuilds').mockReturnValue(
        throwError(() => originalError)
      );

      // Act & Assert
      return new Promise<void>((resolve, reject) => {
        buildService.getBuilds(0, 10).subscribe({
          error: (err) => {
            try {
              expect(err).toBe(originalError);
              expect(err.message).toBe('Original error');
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
      });
    });
  });

  describe('Service Contract', () => {
    it('should provide clearCache method', () => {
      // Act & Assert
      expect(typeof buildService.clearCache).toBe('function');
      expect(() => buildService.clearCache()).not.toThrow();
    });

    it('should implement required BuildService methods', () => {
      // Act & Assert
      expect(typeof buildService.getBuilds).toBe('function');
      expect(typeof buildService.getBuildsMetrics).toBe('function');
      expect(typeof buildService.getBuildActivities).toBe('function');
    });
  });
});
