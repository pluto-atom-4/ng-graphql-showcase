import { Injectable, signal, effect, OnDestroy } from '@angular/core';
import { Observable, Subject, map, filter, takeUntil, BehaviorSubject, finalize } from 'rxjs';
import { BuildService } from './build.service';
import { BuildStatusService } from '../api/build-status.service';

export interface Build {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  parts: Array<{ id: string; name: string; sku: string; quantity: number }>;
  testRuns: Array<{ id: string; status: string; result: string | null; fileUrl: string | null }>;
}

/**
 * BuildStateWorkerService: Centralized build state management
 *
 * Single source of truth for all build data. Maintains canonical state
 * combining query results + real-time subscription updates.
 *
 * Architecture:
 * - Signal: buildMap stores canonical state
 * - Computed: buildMap$ exposes as readonly
 * - Effect: Persists to localStorage for resilience
 * - Subscriptions: Merged from BuildService + BuildStatusService
 *
 * Both Card (list view) + Modal (details view) consume from this service
 * → Automatic sync without duplicate subscriptions
 *
 * Resilience:
 * - localStorage keeps last known state
 * - On disconnect: UI shows cached state + offline badge
 * - On reconnect: Merges updates, reconciles conflicts
 */
@Injectable({ providedIn: 'root' })
export class BuildStateWorkerService implements OnDestroy {
  private buildMap = signal<Map<string, Build>>(this.loadFromLocalStorage());
  private buildMap$$ = new BehaviorSubject<Map<string, Build>>(this.buildMap());

  private destroy$ = new Subject<void>();
  private activeSubscriptions = new Set<string>();
  private refetchInProgress = new Set<string>();

  // Bound event handlers for proper cleanup
  private onOnline = () => this.onConnectionRestored();
  private onOffline = () => this.onConnectionLost();

  constructor(
    private buildService: BuildService,
    private buildStatusService: BuildStatusService
  ) {
    // Persist to localStorage + emit to observable whenever buildMap changes
    effect(() => {
      const map = this.buildMap();
      this.buildMap$$.next(map);
      map.forEach((build: any, id) => {
        this.persistToLocalStorage(id, build);
      });
    });

    // Listen for connection changes (with bound handlers for proper cleanup)
    window.addEventListener('online', this.onOnline);
    window.addEventListener('offline', this.onOffline);
  }

  /**
   * Subscribe to a build: fetch initial data + real-time updates
   */
  subscribeToBuild(buildId: string): void {
    // Prevent duplicate subscriptions
    if (this.activeSubscriptions.has(buildId)) {
      return;
    }

    this.activeSubscriptions.add(buildId);

    // 1. Fetch initial data via query
    this.buildService
      .getBuildById(buildId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (build) => {
          if (build) {
            this.updateBuild(buildId, build);
          }
        },
        error: (err) => {
          console.error(`[BuildStateWorkerService] Failed to fetch build ${buildId}:`, err);
        }
      });

    // 2. Subscribe to real-time status updates
    this.buildStatusService.subscribeToBuildStatus(buildId);
    this.buildStatusService
      .getBufferedUpdates()
      .pipe(
        map((updates: any) => updates[updates.length - 1]), // Get latest
        filter((update: any) => update?.buildId === buildId),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (update: any) => {
          if (update) {
            this.updateBuildStatus(buildId, update.newStatus);
          }
        },
        error: (err) => {
          console.error(`[BuildStateWorkerService] Failed to receive status update for build ${buildId}:`, err);
        }
      });
  }

  /**
   * Unsubscribe from a build: cleanup when component unmounts
   */
  unsubscribeBuild(buildId: string): void {
    this.activeSubscriptions.delete(buildId);
  }

  /**
   * Get all builds as observable from signal
   */
  getBuilds$(): Observable<Map<string, Build>> {
    return this.buildMap$$.asObservable();
  }

  /**
   * Get single build by ID (snapshot)
   */
  getBuild(buildId: string): Build | null {
    return this.buildMap().get(buildId) || null;
  }

  /**
   * Internal: Update entire build object
   */
  private updateBuild(buildId: string, build: Build): void {
    const map = new Map(this.buildMap());
    map.set(buildId, build);
    this.buildMap.set(map);
  }

  /**
   * Internal: Update only build status (from real-time subscription)
   */
  private updateBuildStatus(buildId: string, newStatus: string): void {
    const map = new Map(this.buildMap());
    const build = map.get(buildId);
    if (build) {
      map.set(buildId, { ...build, status: newStatus, updatedAt: new Date() });
      this.buildMap.set(map);
    }
  }

  /**
   * Load cached state from localStorage
   */
  private loadFromLocalStorage(): Map<string, Build> {
    const map = new Map<string, Build>();
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith('build-')) {
        const buildId = key.replace('build-', '');
        const json = localStorage.getItem(key);
        if (json) {
          try {
            const build = JSON.parse(json) as Build;
            map.set(buildId, build);
          } catch (e) {
            console.warn(`Failed to parse cached build ${buildId}`, e);
          }
        }
      }
    });
    return map;
  }

  /**
   * Persist build to localStorage
   */
  private persistToLocalStorage(buildId: string, build: Build): void {
    try {
      localStorage.setItem(`build-${buildId}`, JSON.stringify(build));
    } catch (e) {
      console.warn(`Failed to persist build ${buildId} to localStorage`, e);
    }
  }

  /**
   * Handle connection loss
   */
  private onConnectionLost(): void {
    console.warn('[BuildStateWorkerService] Connection lost, using cached state');
  }

  /**
   * Handle connection restored: refetch with deduplication
   */
  private onConnectionRestored(): void {
    console.log('[BuildStateWorkerService] Connection restored, syncing state');
    // Refetch all active subscriptions (deduplicated)
    Array.from(this.activeSubscriptions).forEach((buildId) => {
      if (this.refetchInProgress.has(buildId)) {
        return; // Skip if already refetching
      }

      this.refetchInProgress.add(buildId);
      this.buildService
        .getBuildById(buildId)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.refetchInProgress.delete(buildId))
        )
        .subscribe({
          next: (build) => {
            if (build) {
              this.updateBuild(buildId, build);
            }
          },
          error: (err) => {
            console.error(`[BuildStateWorkerService] Reconnect refetch failed for build ${buildId}:`, err);
          }
        });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.buildMap$$.complete();
    window.removeEventListener('online', this.onOnline);
    window.removeEventListener('offline', this.onOffline);
  }
}
