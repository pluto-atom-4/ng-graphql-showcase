---
applies_to:
  - "**/*.graphql"
  - "backend/src/**/*Query*.cs"
  - "backend/src/**/*Mutation*.cs"
  - "backend/src/**/*Subscription*.cs"
autoload: onEdit
priority: high
---

# GraphQL Patterns (Hot Chocolate)

**Reference**: [.claude/rules/graphql-patterns.md](../../.claude/rules/graphql-patterns.md)

## Quick Rules

| Rule                | Enforcement                                                                            |
| ------------------- | -------------------------------------------------------------------------------------- |
| **Query Depth**     | Max 5 layers nesting. Split deeper queries → separate requests.                        |
| **Entity Exposure** | NEVER return raw EF Core entities. Map to DTOs first.                                  |
| **Projections**     | Use `[UseProjection]` on resolvers to optimize SQL SELECT.                             |
| **DataLoaders**     | Prevent N+1 queries on child entities (Build → Parts → TestRuns).                      |
| **Subscriptions**   | WebSockets (>1/sec) or SSE (lower freq). Use `bufferTime(250)` aggregation in Angular. |

## Critical: Entity Exposure Rule

**Raw entities expose internal fields + enable overfetching. Always use DTOs:**

```csharp
// ❌ Bad
public Build GetBuild(int id)
  => _context.Builds.FirstOrDefault(b => b.Id == id);

// ✅ Good
public BuildDto GetBuild(int id)
  => _context.Builds
    .Where(b => b.Id == id)
    .ProjectTo<BuildDto>(mapper.ConfigurationProvider)
    .FirstOrDefault();
```

## Query Depth Limit (5 layers max)

```graphql
# ❌ Bad (too deep)
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

# ✅ Good (split into separate requests)
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

## Auto-Generated Type Safety

- **Never edit** `schema.graphql` or `graphql.ts` manually
- `schema.graphql` auto-emitted on `dotnet build`
- `graphql.ts` auto-generated on `pnpm codegen`
- C# entity changes → schema.graphql → graphql.ts (automatic)

## Essential Commands

```bash
dotnet build backend/FactoryApp.slnx    # Emits schema.graphql
pnpm codegen                             # Auto-generates graphql.ts
pnpm --filter frontend run build         # Validates type safety
```
