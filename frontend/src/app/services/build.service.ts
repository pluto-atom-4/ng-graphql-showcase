import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Apollo, gql } from 'apollo-angular';

type BuildDetail = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  parts: Array<{ id: string; name: string; sku: string; quantity: number }>;
  testRuns: Array<{ id: string; status: string; result: string | null; fileUrl: string | null }>;
};

@Injectable({
  providedIn: 'root',
})
export class BuildService {
  constructor(private apollo: Apollo) {}

  getBuildById(id: string): Observable<BuildDetail | null> {
    return this.apollo
      .watchQuery<{ build: BuildDetail }, { id: string }>({
        query: gql`query GetBuildById($id: UUID!) {
          build(id: $id) {
            id
            name
            description
            status
            createdAt
            updatedAt
            parts {
              id
              name
              sku
              quantity
            }
            testRuns {
              id
              status
              result
              fileUrl
            }
          }
        }`,
        variables: { id },
        fetchPolicy: 'cache-first',
      })
      .valueChanges.pipe(
        map((result) => result.data?.build || null),
      );
  }

  getAllBuilds(): Observable<Array<{ id: string; name: string }>> {
    return this.apollo
      .watchQuery<{ builds: Array<{ id: string; name: string }> }>({
        query: gql`query GetAllBuilds {
          builds {
            id
            name
          }
        }`,
        fetchPolicy: 'cache-first',
      })
      .valueChanges.pipe(
        map((result) => result.data?.builds || []),
      );
  }
}
