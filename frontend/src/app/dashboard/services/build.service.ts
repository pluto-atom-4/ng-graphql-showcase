import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map, shareReplay, bufferTime, filter } from 'rxjs/operators';

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

@Injectable({
  providedIn: 'root'
})
export class BuildService {
  private buildsCache = new Map<string, Observable<BuildsResult>>();

  constructor(private apollo: Apollo) {}

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

  subscribeToStatusChange(buildId: string): Observable<Build> {
    return this.apollo
      .subscribe<{ buildStatusChanged: Build }>({
        query: BUILDS_SUBSCRIPTION,
        variables: { buildId }
      })
      .pipe(map((result) => result.data.buildStatusChanged));
  }

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

  getBuildActivities(buildId: string, limit = 10): Observable<Activity[]> {
    return this.apollo
      .query<{ buildActivities: Activity[] }>({
        query: GET_BUILD_ACTIVITIES,
        variables: { buildId, limit }
      })
      .pipe(
        map((result) => result.data.buildActivities),
        shareReplay(1)
      );
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
