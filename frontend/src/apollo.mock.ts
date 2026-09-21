// Mock apollo-angular for vitest to avoid ESM resolution issues
// This file is used via vitest.config.ts alias when running tests

// Import RxJS for real observables
import { of, OperatorFunction } from 'rxjs';

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

// Mock Apollo class for testing
export class Apollo {
  Query = Query;
  Mutation = Mutation;
  Subscription = Subscription;

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
      builds: [],
      // Default empty data - tests can extend this
    } as T;

    // Wrap the result in a data property to match Apollo's response shape
    const wrappedResult = { data: mockResult };
    const valueChanges$ = of(wrappedResult);

    return {
      valueChanges: valueChanges$,
      pipe: (...operators: OperatorFunction<unknown, unknown>[]) => {
        return (valueChanges$ as any).pipe(...(operators as any));
      }
    };
  }
}

export function gql(strings: TemplateStringsArray) {
  return strings.join('');
}

export const ApolloModule = {};
export const APOLLO_NAMED_OPERATIONS = {};
