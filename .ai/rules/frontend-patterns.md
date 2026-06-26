# Frontend Patterns (Angular, GraphQL Client)

## Stack

- **Framework**: Angular 19+
- **Testing**: Vitest + Testing Library
- **GraphQL**: Hot Chocolate subscriptions (WebSockets/SSE)
- **Type Safety**: Auto-generated graphql.ts from schema.graphql

## Type Safety Pipeline

C# entity → schema.graphql → graphql.ts (auto-generated)

**Never edit graphql.ts manually**. Regenerate after schema changes:

```bash
pnpm codegen
```

Angular components import typed queries:

```typescript
import { BuildQuery } from "../graphql.ts"; // Auto-generated, type-safe
```

## Performance Rules

### \*ngFor with trackBy

Always provide explicit `trackBy` function:

```typescript
// ❌ Bad
<div *ngFor="let part of parts">{{ part.name }}</div>

// ✅ Good
<div *ngFor="let part of parts; trackBy: trackByPartId">
  {{ part.name }}
</div>

trackByPartId(index: number, part: Part) {
  return part.id;
}
```

### GraphQL Subscriptions with Buffering

High-frequency updates (>10/sec) should be aggregated:

```typescript
this.graphQL
  .subscription(MySubscription)
  .pipe(
    bufferTime(250), // Aggregate updates every 250ms
    filter((updates) => updates.length > 0),
  )
  .subscribe((updates) => this.processUpdates(updates));
```

### DataLoaders & Projections

Backend uses DataLoaders + `[UseProjection]` to prevent N+1 queries. Frontend benefits from:

- Faster GraphQL responses
- Smaller payload sizes
- Consistent, optimized queries

See [[graphql-patterns]] for query depth limits.

## Testing

```bash
pnpm --filter frontend run test    # Run tests
pnpm --filter frontend run ng serve # Dev server (port 4200)
pnpm --filter frontend run build    # Production build
```

**Testing Library** patterns:

- Query by accessible role (`getByRole`, `getByLabel`)
- Avoid testing implementation details
- Test user interactions, not component internals

## Real-Time Updates

Hot Chocolate subscriptions via:

- **WebSockets**: Preferred for high-frequency (>1/sec)
- **SSE**: For lower frequency, simpler fallback

Example:

```typescript
subscription {
  buildStatusChanged(buildId: "123") {
    id
    status
    updatedAt
  }
}
```

Use `bufferTime(250)` to aggregate rapid updates in Angular.

## Common Issues

| Issue                    | Solution                                           |
| ------------------------ | -------------------------------------------------- |
| "graphql.ts out of sync" | Run `pnpm codegen` after backend schema changes    |
| "N+1 query perf issue"   | Backend should have DataLoader + `[UseProjection]` |
| "Type not found"         | Run `dotnet build` → `pnpm codegen`                |
| "Subscription drops"     | Add retry logic with exponential backoff           |
