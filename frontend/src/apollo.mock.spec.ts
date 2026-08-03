import { describe, it, expect } from 'vitest';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

describe('Apollo Mock Implementation', () => {
  let apollo: Apollo;

  beforeEach(async () => {
    apollo = new Apollo();
  });

  describe('watchQuery Method', () => {
    it('should return an object with valueChanges property', () => {
      const query = gql`query GetBuilds { builds { id name } }`;
      const result = apollo.watchQuery({
        query,
      });

      expect(result).toBeDefined();
      expect(result.valueChanges).toBeDefined();
    });

    it('should return Observable from valueChanges', async () => {
      const query = gql`query GetBuilds { builds { id name } }`;
      const result = apollo.watchQuery({
        query,
      });

      const value = await firstValueFrom(result.valueChanges);
      expect(value).toBeDefined();
      expect(value.data).toBeDefined();
    });

    it('should support generic type parameters T and V', () => {
      type QueryResult = { builds: Array<{ id: string; name: string }> };
      type QueryVariables = { limit?: number };

      const query = gql`query GetBuilds($limit: Int) { builds(limit: $limit) { id name } }`;
      const result = apollo.watchQuery<QueryResult, QueryVariables>({
        query,
        variables: { limit: 10 },
      });

      expect(result).toBeDefined();
      expect(result.valueChanges).toBeDefined();
    });

    it('should work with map operator (like BuildService does)', async () => {
      type BuildDetail = { id: string; name: string; status: string };
      type QueryResult = { build: BuildDetail };

      const query = gql`query GetBuildById($id: UUID!) { build(id: $id) { id name status } }`;
      const result = apollo.watchQuery<QueryResult, { id: string }>({
        query,
        variables: { id: 'test-id' },
      });

      const buildOrNull = await firstValueFrom(
        result.valueChanges.pipe(
          map((response) => response.data?.build || null)
        )
      );

      // Should return null if no data
      expect(buildOrNull).toBeNull();
    });

    it('should support multiple calls with different queries', async () => {
      const query1 = gql`query GetBuilds { builds { id } }`;
      const query2 = gql`query GetBuild($id: UUID!) { build(id: $id) { id name } }`;

      const result1 = apollo.watchQuery({ query: query1 });
      const result2 = apollo.watchQuery({ query: query2, variables: { id: 'test' } });

      const value1 = await firstValueFrom(result1.valueChanges);
      const value2 = await firstValueFrom(result2.valueChanges);

      expect(value1).toBeDefined();
      expect(value2).toBeDefined();
    });

    it('should support pipe method for operator chaining', async () => {
      const query = gql`query GetBuilds { builds { id name } }`;
      const result = apollo.watchQuery({
        query,
      });

      const value = await firstValueFrom(
        (result as any).pipe(
          map((response: any) => response.data)
        )
      );

      expect(value).toBeDefined();
    });

    it('should work with fetchPolicy option', async () => {
      const query = gql`query GetBuilds { builds { id } }`;
      const result = apollo.watchQuery({
        query,
        fetchPolicy: 'cache-and-network',
      });

      expect(result.valueChanges).toBeDefined();
      const value = await firstValueFrom(result.valueChanges);
      expect(value.data).toBeDefined();
    });

    it('should accept options without variables', async () => {
      const query = gql`query GetAllBuilds { builds { id name } }`;
      const result = apollo.watchQuery({
        query,
        fetchPolicy: 'cache-first',
      });

      expect(result).toBeDefined();
      const value = await firstValueFrom(result.valueChanges);
      expect(value).toBeDefined();
    });

    it('should work with subscription pattern', async () => {
      type QueryResult = { builds: Array<{ id: string; name: string }> };
      const query = gql`query GetBuilds { builds { id name } }`;
      const result = apollo.watchQuery<QueryResult>({
        query,
      });

      // Should support subscription pattern
      let emissionCount = 0;
      const subscription = result.valueChanges.subscribe((value) => {
        emissionCount++;
        expect(value.data).toBeDefined();
      });

      await new Promise(resolve => setTimeout(resolve, 10));
      subscription.unsubscribe();

      expect(emissionCount).toBeGreaterThan(0);
    });
  });

  describe('gql Function', () => {
    it('should process template string', () => {
      const query = gql`query GetBuilds { builds { id } }`;
      expect(query).toBeTruthy();
      expect(typeof query).toBe('string');
    });
  });

  describe('Apollo Class Structure', () => {
    it('should have Query class', () => {
      const QueryClass = apollo.Query;
      expect(QueryClass).toBeDefined();
      expect(typeof QueryClass).toBe('function');
    });

    it('should have Mutation class', () => {
      const MutationClass = apollo.Mutation;
      expect(MutationClass).toBeDefined();
      expect(typeof MutationClass).toBe('function');
    });

    it('should have Subscription class', () => {
      const SubscriptionClass = apollo.Subscription;
      expect(SubscriptionClass).toBeDefined();
      expect(typeof SubscriptionClass).toBe('function');
    });
  });

  describe('Integration with BuildService Pattern', () => {
    it('should support BuildService.getBuildById pattern', async () => {
      type BuildDetail = {
        id: string;
        name: string;
        description: string | null;
        status: string;
      };
      type QueryResult = { build: BuildDetail };

      const getBuildById = (id: string) => {
        const query = gql`query GetBuildById($id: UUID!) {
          build(id: $id) {
            id
            name
            description
            status
          }
        }`;

        return apollo
          .watchQuery<QueryResult, { id: string }>({
            query,
            variables: { id },
            fetchPolicy: 'cache-and-network',
          })
          .valueChanges.pipe(
            map((result) => result.data?.build || null)
          );
      };

      const result = await firstValueFrom(getBuildById('test-123'));
      expect(result).toBeNull();
    });
  });
});
