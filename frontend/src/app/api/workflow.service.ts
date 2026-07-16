import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, Subject, Subscription } from 'rxjs';
import { bufferTime, filter, map, startWith, takeUntil } from 'rxjs/operators';
import {
  GetWorkflowQuery,
  GetWorkflowQueryVariables,
  GetWorkflowsByBuildQuery,
  GetWorkflowsByBuildQueryVariables,
  GetWorkflowHistoryQuery,
  GetWorkflowHistoryQueryVariables,
  WorkflowUpdatedSubscription,
  WorkflowUpdatedSubscriptionVariables,
  WorkflowHistoryAddedSubscription,
  WorkflowHistoryAddedSubscriptionVariables,
  GetWorkflowDocument,
  GetWorkflowsByBuildDocument,
  GetWorkflowHistoryDocument,
  WorkflowUpdatedDocument,
  WorkflowHistoryAddedDocument,
} from './generated/graphql';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private destroy$ = new Subject<void>();
  private workflowSubscriptions = new Map<string, Subscription>();
  private historySubscriptions = new Map<string, Subscription>();

  constructor(private apollo: Apollo) {}

  /**
   * Fetch single workflow instance by ID
   * Returns: Complete workflow with activities and history
   */
  getWorkflow(workflowId: string): Observable<GetWorkflowQuery['workflow']> {
    return this.apollo
      .watchQuery<GetWorkflowQuery, GetWorkflowQueryVariables>({
        query: GetWorkflowDocument,
        variables: { id: workflowId },
      })
      .valueChanges.pipe(
        map((result) => result.data.workflow),
        takeUntil(this.destroy$)
      );
  }

  /**
   * Fetch all workflows for a build
   */
  getWorkflowsByBuild(
    buildId: string
  ): Observable<GetWorkflowsByBuildQuery['workflowsByBuild']> {
    return this.apollo
      .watchQuery<GetWorkflowsByBuildQuery, GetWorkflowsByBuildQueryVariables>({
        query: GetWorkflowsByBuildDocument,
        variables: { buildId },
      })
      .valueChanges.pipe(
        map((result) => result.data.workflowsByBuild),
        takeUntil(this.destroy$)
      );
  }

  /**
   * Fetch workflow history records (paginated)
   */
  getWorkflowHistory(
    workflowId: string,
    limit: number = 100
  ): Observable<GetWorkflowHistoryQuery['workflowHistory']> {
    return this.apollo
      .watchQuery<GetWorkflowHistoryQuery, GetWorkflowHistoryQueryVariables>({
        query: GetWorkflowHistoryDocument,
        variables: { workflowId, limit },
      })
      .valueChanges.pipe(
        map((result) => result.data.workflowHistory),
        takeUntil(this.destroy$)
      );
  }

  /**
   * Subscribe to workflow status updates (real-time)
   * Buffers updates every 250ms to reduce UI churn
   * Returns: WorkflowInstance with updated status
   */
  subscribeToWorkflowUpdates(
    workflowId: string
  ): Observable<WorkflowUpdatedSubscription['workflowUpdated']> {
    // Cancel existing subscription if any
    this.workflowSubscriptions.get(workflowId)?.unsubscribe();

    const subscription = this.apollo
      .subscribe<WorkflowUpdatedSubscription, WorkflowUpdatedSubscriptionVariables>({
        query: WorkflowUpdatedDocument,
        variables: { workflowId },
      })
      .pipe(
        map((result) => result.data?.workflowUpdated),
        filter((update) => !!update), // Filter nulls
        bufferTime(250), // Aggregate updates every 250ms
        filter((updates) => updates.length > 0), // Skip empty buffers
        map((updates) => updates[updates.length - 1]), // Take latest
        startWith(undefined), // Allow initial null
        takeUntil(this.destroy$)
      )
      .subscribe(); // Keep subscription alive

    this.workflowSubscriptions.set(workflowId, subscription);

    return this.apollo
      .subscribe<WorkflowUpdatedSubscription, WorkflowUpdatedSubscriptionVariables>({
        query: WorkflowUpdatedDocument,
        variables: { workflowId },
      })
      .pipe(
        map((result) => result.data?.workflowUpdated),
        filter((update) => !!update), // Filter nulls
        bufferTime(250),
        filter((updates) => updates.length > 0),
        map((updates) => updates[updates.length - 1]),
        takeUntil(this.destroy$)
      );
  }

  /**
   * Subscribe to new workflow history events (real-time)
   * Buffers updates every 250ms
   * Returns: New WorkflowHistory record
   */
  subscribeToHistoryAdded(
    workflowId: string
  ): Observable<WorkflowHistoryAddedSubscription['workflowHistoryAdded']> {
    // Cancel existing subscription if any
    this.historySubscriptions.get(workflowId)?.unsubscribe();

    const subscription = this.apollo
      .subscribe<
        WorkflowHistoryAddedSubscription,
        WorkflowHistoryAddedSubscriptionVariables
      >({
        query: WorkflowHistoryAddedDocument,
        variables: { workflowId },
      })
      .pipe(
        map((result) => result.data?.workflowHistoryAdded),
        filter((event) => !!event), // Filter nulls
        bufferTime(250), // Aggregate events every 250ms
        filter((events) => events.length > 0), // Skip empty buffers
        map((events) => events[events.length - 1]), // Take latest
        startWith(undefined), // Allow initial null
        takeUntil(this.destroy$)
      )
      .subscribe(); // Keep subscription alive

    this.historySubscriptions.set(workflowId, subscription);

    return this.apollo
      .subscribe<
        WorkflowHistoryAddedSubscription,
        WorkflowHistoryAddedSubscriptionVariables
      >({
        query: WorkflowHistoryAddedDocument,
        variables: { workflowId },
      })
      .pipe(
        map((result) => result.data?.workflowHistoryAdded),
        filter((event) => !!event), // Filter nulls
        bufferTime(250),
        filter((events) => events.length > 0),
        map((events) => events[events.length - 1]),
        takeUntil(this.destroy$)
      );
  }

  /**
   * Unsubscribe from workflow updates for a specific workflow
   */
  unsubscribeFromWorkflow(workflowId: string): void {
    this.workflowSubscriptions.get(workflowId)?.unsubscribe();
    this.workflowSubscriptions.delete(workflowId);
    this.historySubscriptions.get(workflowId)?.unsubscribe();
    this.historySubscriptions.delete(workflowId);
  }

  /**
   * Cleanup all subscriptions on service destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.workflowSubscriptions.forEach((sub) => sub.unsubscribe());
    this.historySubscriptions.forEach((sub) => sub.unsubscribe());
    this.workflowSubscriptions.clear();
    this.historySubscriptions.clear();
  }
}
