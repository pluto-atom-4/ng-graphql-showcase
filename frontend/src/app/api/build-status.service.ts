import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { BehaviorSubject, Observable, Subject, interval } from 'rxjs';
import { bufferTime, filter, retry, tap } from 'rxjs/operators';
import { BuildStatusUpdatedSubscription, BuildStatusUpdatedSubscriptionVariables } from './generated/graphql';

export interface BuildStatusUpdate {
  buildId: string;
  oldStatus: string;
  newStatus: string;
  timestamp: Date;
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
  private buildStatusUpdates$ = new Subject<BuildStatusUpdate>();
  private statusSubject = new BehaviorSubject<BuildStatusUpdate[]>([]);

  public buildStatus$ = this.statusSubject.asObservable();

  constructor() {
    this.initializeSubscription();
  }

  /**
   * Subscribe to build status updates for specific build.
   * Updates buffered every 250ms to prevent high-frequency UI thrashing.
   */
  subscribeToBuildStatus(buildId: string): void {
    this.apollo
      .subscribe<BuildStatusUpdatedSubscription, BuildStatusUpdatedSubscriptionVariables>({
        query: BUILD_STATUS_UPDATED_SUBSCRIPTION,
        variables: { buildId }
      })
      .pipe(
        tap(result => {
          if (result.data?.buildStatusUpdated) {
            const update = result.data.buildStatusUpdated;
            this.buildStatusUpdates$.next({
              buildId: update.buildId,
              oldStatus: update.oldStatus,
              newStatus: update.newStatus,
              timestamp: new Date(update.timestamp)
            });
          }
        }),
        // Retry subscription on error (max 3 attempts with exponential backoff)
        retry({
          count: 3,
          delay: (error, count) => {
            console.warn(`Subscription error (attempt ${count}):`, error);
            return interval(Math.pow(2, count) * 1000);
          }
        })
      )
      .subscribe({
        error: (err) => console.error('Subscription failed:', err)
      });
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

  private initializeSubscription(): void {
    // Initialize with empty array
    this.statusSubject.next([]);
  }
}
