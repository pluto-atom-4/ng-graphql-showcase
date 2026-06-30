import { Injectable, inject, DestroyRef } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { BehaviorSubject, Observable, Subject, interval, Subscription } from 'rxjs';
import { bufferTime, filter, retry, tap, takeUntilDestroyed } from 'rxjs/operators';
import { BuildStatusUpdatedSubscription, BuildStatusUpdatedSubscriptionVariables } from './generated/graphql';

export interface BuildStatusUpdate {
  buildId: string;
  oldStatus: string;
  newStatus: string;
  timestamp: Date;
}

export interface ConnectionHealth {
  isConnected: boolean;
  lastHeartbeat: Date;
  reconnectAttempts: number;
  lastError?: string;
}

const BUILD_STATUS_UPDATED_SUBSCRIPTION = gql`
  subscription BuildStatusUpdated($buildId: ID!) {
    buildStatusUpdated(buildId: $buildId) {
      buildId
      oldStatus
      newStatus
      timestamp
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class BuildStatusService {
  private apollo = inject(Apollo);
  private destroyRef = inject(DestroyRef);
  private buildStatusUpdates$ = new Subject<BuildStatusUpdate>();
  private statusSubject = new BehaviorSubject<BuildStatusUpdate[]>([]);
  private connectionHealthSubject = new BehaviorSubject<ConnectionHealth>({
    isConnected: false,
    lastHeartbeat: new Date(),
    reconnectAttempts: 0,
  });

  public buildStatus$ = this.statusSubject.asObservable();
  public connectionHealth$ = this.connectionHealthSubject.asObservable();

  private activeSubscriptions = new Map<string, Subscription>();
  private readonly SUBSCRIPTION_TIMEOUT = 30000; // 30s timeout
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly RECONNECT_BASE_DELAY = 1000; // 1s base

  constructor() {
    this.initializeSubscription();
  }

  /**
   * Subscribe to build status updates for specific build.
   * Production-grade resilience: reconnection, timeouts, health monitoring.
   */
  subscribeToBuildStatus(buildId: string): void {
    // Cancel existing subscription for this buildId
    this.activeSubscriptions.get(buildId)?.unsubscribe();

    const subscription = this.apollo
      .subscribe<BuildStatusUpdatedSubscription, BuildStatusUpdatedSubscriptionVariables>({
        query: BUILD_STATUS_UPDATED_SUBSCRIPTION,
        variables: { buildId }
      })
      .pipe(
        tap(
          result => {
            // Update health on successful data
            this.updateConnectionHealth(true, 0);

            if (result.data?.buildStatusUpdated) {
              const update = result.data.buildStatusUpdated;
              this.buildStatusUpdates$.next({
                buildId: update.buildId,
                oldStatus: update.oldStatus,
                newStatus: update.newStatus,
                timestamp: new Date(update.timestamp)
              });
            }
          },
          error => {
            // Track connection errors
            const health = this.connectionHealthSubject.value;
            this.updateConnectionHealth(false, health.reconnectAttempts + 1, error?.message);
          }
        ),
        // Production retry: up to 10 attempts with exponential backoff (capped at 30s)
        retry({
          count: this.MAX_RECONNECT_ATTEMPTS,
          delay: (error, count) => {
            if (count >= this.MAX_RECONNECT_ATTEMPTS) {
              console.error(`Subscription exhausted retries after ${count} attempts`, error);
              this.updateConnectionHealth(false, count, 'Max reconnection attempts exceeded');
            } else {
              const delayMs = Math.min(this.RECONNECT_BASE_DELAY * Math.pow(2, count), 30000);
              console.warn(
                `Subscription reconnecting (attempt ${count}/${this.MAX_RECONNECT_ATTEMPTS}) in ${delayMs}ms`,
                error?.message
              );
            }
            return interval(
              Math.min(this.RECONNECT_BASE_DELAY * Math.pow(2, count), 30000)
            );
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        error: (err) => {
          console.error('Subscription failed after all retries:', err);
          this.updateConnectionHealth(false, this.MAX_RECONNECT_ATTEMPTS, err?.message);
        },
        complete: () => {
          console.log(`Subscription completed for buildId: ${buildId}`);
          this.activeSubscriptions.delete(buildId);
        }
      });

    this.activeSubscriptions.set(buildId, subscription);
  }

  /**
   * Get buffered status updates (250ms buffer).
   * Prevents overwhelming UI with high-frequency updates.
   */
  getBufferedUpdates(): Observable<BuildStatusUpdate[]> {
    return this.buildStatusUpdates$.pipe(
      bufferTime(250),
      filter(updates => updates.length > 0)
    );
  }

  /**
   * Clear buffered updates.
   */
  clearUpdates(): void {
    this.statusSubject.next([]);
  }

  /**
   * Get connection health status.
   */
  getConnectionHealth(): Observable<ConnectionHealth> {
    return this.connectionHealth$;
  }

  /**
   * Manually disconnect subscription (cleanup).
   */
  disconnect(buildId: string): void {
    const subscription = this.activeSubscriptions.get(buildId);
    if (subscription) {
      subscription.unsubscribe();
      this.activeSubscriptions.delete(buildId);
    }
  }

  /**
   * Disconnect all subscriptions (for cleanup on component destroy).
   */
  disconnectAll(): void {
    this.activeSubscriptions.forEach((sub) => sub.unsubscribe());
    this.activeSubscriptions.clear();
  }

  /**
   * Update connection health tracking.
   */
  private updateConnectionHealth(
    isConnected: boolean,
    reconnectAttempts: number,
    lastError?: string
  ): void {
    this.connectionHealthSubject.next({
      isConnected,
      lastHeartbeat: new Date(),
      reconnectAttempts,
      lastError,
    });
  }

  private initializeSubscription(): void {
    // Initialize with empty array
    this.statusSubject.next([]);
  }
}
