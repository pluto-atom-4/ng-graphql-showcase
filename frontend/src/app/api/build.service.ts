import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Build, GetBuildDocument } from './generated/graphql';

@Injectable({
  providedIn: 'root',
})
export class BuildService {
  constructor(private apollo: Apollo) {}

  getBuild(buildId: string): Observable<Build> {
    return this.apollo
      .query<{ build: Build }>({
        query: GetBuildDocument,
        variables: { id: buildId },
      })
      .pipe(map((result) => result.data.build));
  }
}
