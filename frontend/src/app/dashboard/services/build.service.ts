import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map, shareReplay, bufferTime, filter, mergeMap } from 'rxjs/operators';

export interface Build {
  id: string;
  name: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETE' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}

export interface BuildsResult {
  builds: Build[];
  total: number;
}

export interface Metrics {
  total: number;
  inProgress: number;
  completed: number;
  failed: number;
}

export interface Activity {
  id: string;
  timestamp: string;
  description: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETE' | 'FAILED';
}

export interface ActivityDto {
  id: string;
  buildId: string;
  eventType: string;
  activityName: string;
  oldStatus: string;
  newStatus: string;
  recordedAt: string;
  executionStarted?: string;
  executionCompleted?: string;
  elapsedMilliseconds?: number;
  errorMessage?: string;
}

const GET_BUILDS = gql`
  query GetBuilds($skip: Int!, $take: Int!) {
    builds(skip: $skip, take: $take) {
      id
      name
      status
      createdAt
      updatedAt
    }
    buildsTotal: builds {
      id
    }
  }
`;

const BUILDS_SUBSCRIPTION = gql`
  subscription BuildStatusChanged($buildId: String!) {
    buildStatusChanged(buildId: $buildId) {
      id
      name
      status
      updatedAt
    }
  }
`;

const GET_BUILDS_METRICS = gql`
  query GetBuildsMetrics {
    builds {
      id
      status
    }
  }
`;

const BUILDS_METRICS_SUBSCRIPTION = gql`
  subscription BuildsMetricsChanged {
    buildStatusChanged {
      id
      status
    }
  }
`;

const GET_BUILD_ACTIVITIES = gql`
  query GetBuildActivities($buildId: String!, $limit: Int!) {
    buildActivities(buildId: $buildId, limit: $limit) {
      id
      timestamp
      description
      status
    }
  }
`;

/**
 * BuildService - GraphQL-based build data access with caching and subscriptions.
 *
 * Provides methods for:
 * - Fetching paginated builds list with caching
 * - Subscribing to individual build status changes
 * - Computing and fetching build metrics
 * - Retrieving build activities/timeline
 *
 * All list subscriptions use bufferTime(250ms) to aggregate high-frequency updates.
 *
 * @example
 * // Fetch paginated builds
 * this.buildService.getBuilds(0, 10).subscribe(result => {
 *   console.log('Builds:', result.builds, 'Total:', result.total);
 * });
 *
 * // Subscribe to status changes with buffering
 * this.buildService.subscribeToStatusChange('build-123').subscribe(build => {
 *   console.log('Build updated:', build);
 * });
 *
 * // Fetch metrics
 * this.buildService.getBuildsMetrics().subscribe(metrics => {
 *   console.log('Metrics:', metrics);
 * });
 */
@Injectable({
  providedIn: 'root'
})
export class BuildService {
  private buildsCache = new Map<string, Observable<BuildsResult>>();

  constructor(private apollo: Apollo) {}

  /**
   * Fetch paginated list of builds.
   *
   * @param skip - Number of items to skip (for pagination)
   * @param take - Number of items to return
   * @returns Observable<BuildsResult> with builds array and total count
   *
   * @caching - Results are cached by `${skip}-${take}` key and shared via shareReplay(1)
   */
  getBuilds(skip: number, take: number): Observable<BuildsResult> {
    const cacheKey = `${skip}-${take}`;

    if (!this.buildsCache.has(cacheKey)) {
      const query$ = this.apollo
        .query<{ builds: Build[]; buildsTotal: { id: string }[] }>({
          query: GET_BUILDS,
          variables: { skip, take }
        })
        .pipe(
          map((result) => ({
            builds: result.data.builds,
            total: result.data.buildsTotal.length
          })),
          shareReplay(1)
        );

      this.buildsCache.set(cacheKey, query$);
    }

    return this.buildsCache.get(cacheKey)!;
  }

  /**
   * Subscribe to build status changes for a specific build.
   *
   * @param buildId - Build ID to subscribe to
   * @returns Observable<Build> emitting updated Build objects
   *
   * @performance - bufferTime(250ms) aggregates rapid updates into single emissions
   */
  subscribeToStatusChange(buildId: string): Observable<Build> {
    return this.apollo
      .subscribe<{ buildStatusChanged: Build }>({
        query: BUILDS_SUBSCRIPTION,
        variables: { buildId }
      })
      .pipe(
        bufferTime(250),
        filter((updates) => updates.length > 0),
        mergeMap((updates) => updates.filter((u) => u.data).map((u) => u.data!.buildStatusChanged))
      );
  }

  /**
   * Fetch current build metrics (total, in progress, completed, failed counts).
   *
   * @returns Observable<Metrics> with build status distribution
   * @caching - Result is cached and shared via shareReplay(1)
   */
  getBuildsMetrics(): Observable<Metrics> {
    return this.apollo
      .query<{ builds: Array<{ id: string; status: string }> }>({
        query: GET_BUILDS_METRICS
      })
      .pipe(
        map((result) => this.calculateMetrics(result.data.builds)),
        shareReplay(1)
      );
  }

  /**
   * Subscribe to real-time build metrics changes.
   *
   * @returns Observable<Metrics> emitting updated metrics
   * @performance - bufferTime(250ms) aggregates rapid updates
   * @note Currently not fully implemented; throws error on emission
   */
  subscribeToMetrics(): Observable<Metrics> {
    return this.apollo
      .subscribe<{ buildStatusChanged: { id: string; status: string } }>({
        query: BUILDS_METRICS_SUBSCRIPTION
      })
      .pipe(
        bufferTime(250),
        filter((updates) => updates.length > 0),
        map(() => {
          throw new Error('Implement metrics calculation from subscription');
        })
      );
  }

  /**
   * Fetch build activities/timeline for a specific build.
   *
   * @param buildId - Build ID to get activities for
   * @param limit - Maximum number of activities to return. Default: 10
   * @returns Observable<Activity[]> with activity records
   * @caching - Result is cached and shared via shareReplay(1)
   */
  getBuildActivities(buildId: string, limit = 10): Observable<Activity[]> {
    return this.apollo
      .query<{ buildActivities: ActivityDto[] }>({
        query: GET_BUILD_ACTIVITIES,
        variables: { buildId, limit }
      })
      .pipe(
        map((result) => result.data.buildActivities.map((dto) => this.mapActivityDtoToActivity(dto))),
        shareReplay(1)
      );
  }

  /**
   * Map ActivityDto from GraphQL to Activity for timeline display.
   * Transforms:
   * - recordedAt → timestamp
   * - activityName → description
   * - newStatus → status (with enum transformation)
   *
   * @param dto - ActivityDto from GraphQL response
   * @returns Activity object for timeline component
   */
  private mapActivityDtoToActivity(dto: ActivityDto): Activity {
    return {
      id: dto.id,
      timestamp: dto.recordedAt,
      description: dto.activityName,
      status: this.transformStatusToEnum(dto.newStatus)
    };
  }

  /**
   * Transform status string to Activity status enum.
   * Maps workflow/activity statuses to timeline display statuses.
   *
   * @param status - Status string from workflow history
   * @returns Activity status enum value
   */
  private transformStatusToEnum(status: string): 'PENDING' | 'RUNNING' | 'COMPLETE' | 'FAILED' {
    switch (status?.toUpperCase()) {
      case 'RUNNING':
      case 'STARTED':
      case 'EXECUTING':
        return 'RUNNING';
      case 'COMPLETE':
      case 'COMPLETED':
      case 'SUCCEEDED':
        return 'COMPLETE';
      case 'FAILED':
      case 'FAILED_WITH_ERROR':
        return 'FAILED';
      case 'PENDING':
      case 'CREATED':
      case 'SUSPENDED':
      default:
        return 'PENDING';
    }
  }

  private calculateMetrics(builds: Array<{ id: string; status: string }>): Metrics {
    return {
      total: builds.length,
      inProgress: builds.filter((b) => b.status === 'RUNNING').length,
      completed: builds.filter((b) => b.status === 'COMPLETE').length,
      failed: builds.filter((b) => b.status === 'FAILED').length
    };
  }

  clearCache(): void {
    this.buildsCache.clear();
  }
}
