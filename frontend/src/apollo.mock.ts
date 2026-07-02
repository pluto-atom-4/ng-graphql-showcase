// Mock apollo-angular for vitest to avoid ESM resolution issues
// This file is used via vitest.config.ts alias when running tests

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

  Query = Query;
  Mutation = Mutation;
  Subscription = Subscription;
}

export function gql(strings: TemplateStringsArray) {
  return strings.join('');
}

export const ApolloModule = {};
export const APOLLO_NAMED_OPERATIONS = {};
