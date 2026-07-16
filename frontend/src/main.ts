import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { InMemoryCache } from '@apollo/client/core';
import { APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { AppComponent } from './app/app.component';

function createApollo(httpLink: HttpLink) {
  return {
    link: httpLink.create({ uri: 'http://localhost:5275/graphql' }),
    cache: new InMemoryCache(),
  };
}

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    {
      provide: APOLLO_OPTIONS,
      useFactory: createApollo,
      deps: [HttpLink],
    },
  ],
}).catch(err => console.error(err));
