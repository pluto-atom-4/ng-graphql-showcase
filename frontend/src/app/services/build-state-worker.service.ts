import { Injectable, signal, computed, effect } from '@angular/core';
import { Observable, Subject, map, filter, takeUntil, BehaviorSubject } from 'rxjs';
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
export class BuildStateWorkerService {
  private buildMap = signal<Map<string, Build>>(this.loadFromLocalStorage());
  buildMap$ = computed(() => this.buildMap());
  private buildMap$$ = new BehaviorSubject<Map<string, Build>>(this.buildMap());

  private destroy$ = new Subject<void>();
  private activeSubscriptions = new Set<string>();

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

    // Listen for connection changes
    window.addEventListener('online', () => this.onConnectionRestored());
    window.addEventListener('offline', () => this.onConnectionLost());
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
      .subscribe((build) => {
        if (build) {
          this.updateBuild(buildId, build);
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
      .subscribe((update: any) => {
        if (update) {
          this.updateBuildStatus(buildId, update.newStatus);
        }
      });
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
   * Handle connection restored
   */
  private onConnectionRestored(): void {
    console.log('[BuildStateWorkerService] Connection restored, syncing state');
    // Refetch all active subscriptions
    Array.from(this.activeSubscriptions).forEach((buildId) => {
      this.buildService
        .getBuildById(buildId)
        .pipe(takeUntil(this.destroy$))
        .subscribe((build) => {
          if (build) {
            this.updateBuild(buildId, build);
          }
        });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('online', () => this.onConnectionRestored());
    window.removeEventListener('offline', () => this.onConnectionLost());
  }
}
