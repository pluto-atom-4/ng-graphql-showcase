---
name: Codegen Sync
description: Synchronize GraphQL schema and generate type-safe frontend code
trigger: "pnpm codegen or after backend schema changes"
atomic: true
scope: schema.graphql → graphql.ts pipeline
---

# Codegen Sync Skill

**Purpose**: Ensure GraphQL schema and generated TypeScript types stay in sync across backend/frontend.

## When to Run

Codegen sync after:

- ✅ Backend schema changes (new field, resolver, subscription)
- ✅ Adding/modifying GraphQL queries in frontend
- ✅ Running `dotnet build` (auto-emits schema.graphql)
- ❌ Never edit graphql.ts manually

## Workflow

### 1. Build Backend (Auto-emits schema.graphql)

```bash
cd backend/src/FactoryApp.WebApi
dotnet build
# schema.graphql auto-generated in repo root
```

### 2. Verify schema.graphql Changed

```bash
git diff schema.graphql
```

Check for expected changes:

- New type definitions
- Resolver additions
- Subscription changes
- Field deprecations marked

### 3. Regenerate graphql.ts

```bash
pnpm codegen
```

This generates:

- Type-safe query/mutation/subscription definitions
- Apollo Client hooks (useQuery, useMutation, useSubscription)
- Result + Variable types for each operation

### 4. Commit Both Files

Always commit together:

```bash
git add schema.graphql graphql.ts
git commit -m "chore: sync GraphQL schema and codegen"
```

**Rule**: schema.graphql + graphql.ts must always be in sync. Mismatches break type safety.

### 5. Update Frontend Code

After codegen, frontend can use new types:

```typescript
import { BuildStatusChangedSubscription } from "../graphql"; // Auto-generated

// Now fully typed
const { data, error } = useSubscription(BuildStatusChangedSubscription, {
  variables: { buildId: "123" },
});
```

## Troubleshooting

| Issue                                    | Solution                                                  |
| ---------------------------------------- | --------------------------------------------------------- |
| "graphql.ts has type errors"             | Run `pnpm codegen` again; may need `pnpm install` first   |
| "schema.graphql doesn't reflect changes" | Run `dotnet build` in WebApi project                      |
| "Type not found in generated code"       | Ensure resolver/field is in schema.graphql before codegen |
| "Apollo hooks not generated"             | Check queries/mutations defined in `.graphql` files       |

## Type Safety Pipeline

```
C# Entity
    ↓
Resolver in HotChocolate (schema mutation)
    ↓
`dotnet build` → schema.graphql (auto-emit)
    ↓
`pnpm codegen` → graphql.ts (auto-generate)
    ↓
Angular imports from graphql.ts (fully typed)
```

Never break the chain.

## Related Rules

See: [[graphql-patterns]], [[frontend-patterns]], [[backend-patterns]]
