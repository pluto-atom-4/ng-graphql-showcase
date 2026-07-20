import { Injectable } from '@angular/core';
import { GetBuildGQL, GetBuildQuery } from '../api/generated/graphql';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Build } from '../api/generated/graphql';
import { ApolloQueryResult } from '@apollo/client/core';

@Injectable({
  providedIn: 'root',
})
export class BuildService {
  constructor(private getBuildGQL: GetBuildGQL) {}

  getBuildById(id: string): Observable<Build | null> {
    return this.getBuildGQL
      .watch({ id }, { fetchPolicy: 'cache-first' })
      .valueChanges.pipe(
        map((result: ApolloQueryResult<GetBuildQuery>) => result.data.build || null),
      );
  }
}
