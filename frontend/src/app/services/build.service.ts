import { Injectable } from '@angular/core';
import { GetBuildGQL, GetBuildQuery } from '../api/generated/graphql';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApolloQueryResult } from '@apollo/client/core';
import { Apollo, gql } from 'apollo-angular';

type BuildDetail = NonNullable<GetBuildQuery['build']>;

@Injectable({
  providedIn: 'root',
})
export class BuildService {
  constructor(
    private getBuildGQL: GetBuildGQL,
    private apollo: Apollo
  ) {}

  getBuildById(id: string): Observable<BuildDetail | null> {
    return this.getBuildGQL
      .watch({ id }, { fetchPolicy: 'cache-first' })
      .valueChanges.pipe(
        map((result: ApolloQueryResult<GetBuildQuery>) => result.data.build),
      );
  }

  getAllBuilds(): Observable<Array<{ id: string; name: string }>> {
    return this.apollo
      .watchQuery<{ builds: Array<{ id: string; name: string }> }>({
        query: gql`
          query {
            builds {
              id
              name
            }
          }
        `,
        fetchPolicy: 'cache-first',
      })
      .valueChanges.pipe(
        map((result) => result.data.builds || []),
      );
  }
}
