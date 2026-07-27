import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

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

  clearCache(): void {
    this.buildsCache.clear();
  }
}
