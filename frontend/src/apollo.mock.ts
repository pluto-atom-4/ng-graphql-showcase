// Mock apollo-angular for vitest to avoid ESM resolution issues
// This file is used via vitest.config.ts alias when running tests

// Import RxJS for real observables
import { of } from 'rxjs';

export class Query<T = any, V = any> {
  document: any;
  constructor(apollo?: any) {}
}

export class Mutation<T = any, V = any> {
  document: any;
  constructor(apollo?: any) {}
}

export class Subscription<T = any, V = any> {
  document: any;
  constructor(apollo?: any) {}
}

export class Apollo {
  subscribe() {
    return {
      pipe: () => ({
        subscribe: () => ({ unsubscribe: () => {} })
      })
    };
  }

  watchQuery<T = any, V = any>(options: any) {
    // Return object with valueChanges observable property
    const mockResult = {
      data: {
        builds: [],
        // Default empty data - tests can extend this
      }
    } as T;

    const valueChanges$ = of(mockResult);

    return {
      valueChanges: valueChanges$,
      pipe: (...operators: any[]) => {
        return valueChanges$.pipe(...operators);
      }
    };
  }

  Query = Query;
  Mutation = Mutation;
  Subscription = Subscription;
}

export function gql(strings: TemplateStringsArray) {
  return strings.join('');
}

export const ApolloModule = {};
export const APOLLO_NAMED_OPERATIONS = {};
