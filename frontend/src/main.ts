import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ApolloClientOptions, InMemoryCache, split } from '@apollo/client/core';
import { getMainDefinition } from '@apollo/client/utilities';
import { APOLLO_OPTIONS, Apollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

function createApollo(httpLink: HttpLink): ApolloClientOptions<any> {
  const wsLink = new GraphQLWsLink(
    createClient({
      url: 'ws://localhost:5275/graphql',
      connectionParams: {
        // Add auth headers if needed
      },
    })
  );

  const httpLinkInstance = httpLink.create({ uri: 'http://localhost:5275/graphql' });

  const link = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      );
    },
    wsLink,
    httpLinkInstance
  );

  return {
    link,
    cache: new InMemoryCache(),
  };
}

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideRouter(routes),
    Apollo,
    {
      provide: APOLLO_OPTIONS,
      useFactory: createApollo,
      deps: [HttpLink],
    },
  ],
}).catch(err => console.error(err));
