# GraphQL Patterns & Type Safety

## Query Depth Limit

Max nesting: **5 layers**. Use DataLoaders + separate requests, not deeply nested queries.

Example:

```graphql
# ❌ Bad: Too deep
query {
  build {
    parts {
      testRuns {
        results {
          measurements {
            values
          }
        }
      }
    }
  }
}

# ✅ Good: Fetch separately
query {
  build(id: "xyz") {
    parts
  }
}

query {
  testRuns(buildId: "xyz") {
    results
  }
}
```

## Entity Exposure Rule

Never return raw EF Core entities in GraphQL resolvers. Map to DTOs first.

```csharp
// ❌ Bad
public Build GetBuild(int id) => _context.Builds.FirstOrDefault(b => b.Id == id);

// ✅ Good
public BuildDto GetBuild(int id) => _context.Builds
  .Where(b => b.Id == id)
  .ProjectTo<BuildDto>(_mapper.ConfigurationProvider)
  .FirstOrDefault();
```

## Generated Files

- `schema.graphql` — Auto-emitted on `dotnet build`; **commit to repo**
- `graphql.ts` — Auto-generated from schema; **never edit manually**

Regenerate codegen after schema changes:

```bash
pnpm codegen
```

## Type Safety Pipeline

Flow: C# entity → schema.graphql → graphql.ts (automatic on build)

- Changes in C# → reflected in schema.graphql (Auto-emit on build)
- schema.graphql changes → trigger codegen (pnpm codegen)
- graphql.ts updated automatically
- Angular components import typed queries from graphql.ts

**Never break the chain**: Always commit schema.graphql after backend changes.

## Hot Chocolate Subscriptions

Real-time updates via:

- WebSockets (preferred for high-frequency updates)
- SSE (Server-Sent Events) for lower frequency

Use `bufferTime(250)` in Angular subscriptions for aggregation.
