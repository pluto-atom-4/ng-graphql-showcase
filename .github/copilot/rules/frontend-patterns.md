---
applies_to:
  - "frontend/src/**/*.ts"
  - "frontend/src/**/*.tsx"
  - "frontend/src/**/*.html"
autoload: onEdit
priority: high
---

# Frontend Patterns (Angular 19)

**Reference**: [.claude/rules/frontend-patterns.md](../../.claude/rules/frontend-patterns.md)

## Quick Rules

| Rule                 | Enforcement                                                                    |
| -------------------- | ------------------------------------------------------------------------------ |
| **Change Detection** | `ChangeDetectionStrategy.OnPush` on all components (mandatory)                 |
| **\*ngFor**          | MUST have explicit `trackBy: trackByFn` function (prevents memory leaks)       |
| **Subscriptions**    | Buffer high-frequency updates: `bufferTime(250)`                               |
| **Type Safety**      | Import from auto-generated `graphql.ts` (never edit manually)                  |
| **Tests**            | Vitest + Testing Library. Query by accessible role (`getByRole`, `getByLabel`) |

## Critical Constraint

**All `*ngFor` loops require `trackBy` function:**

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

## Type-Safety Pipeline

1. Backend entity change → `dotnet build` (emits schema.graphql)
2. `pnpm codegen` (auto-generates graphql.ts)
3. Angular components import from graphql.ts
4. Full type safety 🎯

Never manually edit `graphql.ts` or `schema.graphql`.

## Subscriptions

For high-frequency updates (>10/sec), aggregate with `bufferTime(250)`:

```typescript
this.graphQL
  .subscription(MySubscription)
  .pipe(
    bufferTime(250),
    filter((updates) => updates.length > 0),
  )
  .subscribe((updates) => this.process(updates));
```

## Essential Commands

```bash
pnpm --filter frontend run build        # Production build
pnpm --filter frontend run test         # Vitest + Testing Library
pnpm --filter frontend run ng serve     # Dev server (port 4200)
pnpm codegen                            # Regenerate graphql.ts
```
