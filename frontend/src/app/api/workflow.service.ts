import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  GetBuildWorkflowHistoryQuery,
  GetBuildWorkflowHistoryQueryVariables,
  GetRecentWorkflowHistoryQuery,
  GetRecentWorkflowHistoryQueryVariables,
  GetBuildWorkflowHistoryDocument,
  GetRecentWorkflowHistoryDocument,
} from './generated/graphql';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  constructor(private apollo: Apollo) {}

  /**
   * Fetch workflow history records for a specific build
   */
  getWorkflowsByBuild(
    buildId: string
  ): Observable<GetBuildWorkflowHistoryQuery['buildWorkflowHistory']> {
    return this.apollo
      .watchQuery<GetBuildWorkflowHistoryQuery, GetBuildWorkflowHistoryQueryVariables>({
        query: GetBuildWorkflowHistoryDocument,
        variables: { buildId },
      })
      .valueChanges.pipe(
        map((result) => result.data.buildWorkflowHistory || [])
      );
  }

  /**
   * Fetch recent workflow history records (last N days)
   */
  getRecentWorkflowHistory(
    days: number = 7
  ): Observable<GetRecentWorkflowHistoryQuery['recentWorkflowHistory']> {
    return this.apollo
      .watchQuery<GetRecentWorkflowHistoryQuery, GetRecentWorkflowHistoryQueryVariables>({
        query: GetRecentWorkflowHistoryDocument,
        variables: { days },
      })
      .valueChanges.pipe(
        map((result) => result.data.recentWorkflowHistory || [])
      );
  }
}
