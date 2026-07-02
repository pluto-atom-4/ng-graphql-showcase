# GraphQL Queries & Subscriptions

**Location**: `frontend/src/app/graphql/build.graphql`  
**Auto-Generated Types**: `frontend/src/app/api/generated/graphql.ts` (DO NOT EDIT)

---

## Architecture

Type-safe GraphQL end-to-end pipeline:

```
build.graphql (source) → codegen.ts → graphql.ts (generated types)
                                    ↓
                            Angular services import types
                                    ↓
                         Components use typed queries
```

**Generated graphql.ts** exports:

- Query types (GetBuild, ListBuilds)
- Mutation types (CreateBuild, UpdateBuildStatus, AddPart, SubmitTestRun)
- Subscription types (BuildStatusUpdated, TestRunCompleted)
- Scalar/enum types (BuildStatus, TestStatus, Decimal)

---

## Queries

### GetBuild

Fetch single build with full details: parts, test runs.

**Parameters**:

- `id` (ID!): Build UUID

**Returns**:

- `id`, `name`, `description`, `status`, `createdAt`, `updatedAt`
- `parts[]`: Part ID, name, SKU, quantity
- `testRuns[]`: Test run status, results, file URL

**Usage**:

```typescript
// Typed query from generated graphql.ts
const result = await apolloClient.query({
  query: GetBuild,
  variables: { id: "build-123" },
});
// result.data.build has full type safety ✓
```

**Backend**: BuildQueryType.GetBuild resolver (backend/src/FactoryApp.GraphQL)

---

### ListBuilds

Paginated list of builds (summary fields only, no nested parts/runs).

**Parameters**:

- `limit` (Int!): Page size (max 100)
- `offset` (Int!): Skip count (0-indexed)

**Returns**:

- `items[]`: ID, name, status, createdAt (lightweight)
- `totalCount` (Int!): Total builds in DB
- `hasNextPage`, `hasPreviousPage` (Boolean): Pagination flags

**Usage**:

```typescript
// Page 1: offset 0, limit 10
const page1 = await apolloClient.query({
  query: ListBuilds,
  variables: { limit: 10, offset: 0 },
});
// page1.data.builds.items has 10 builds (or fewer)
// page1.data.builds.hasNextPage indicates if more pages exist
```

**Note**: Use for dashboard lists. Use GetBuild for detail pages.

**Backend**: BuildQueryType.GetBuildsPaginated resolver

---

## Mutations

### CreateBuild

Create new build record.

**Parameters**:

- `name` (String!): Build name (1-256 chars)
- `description` (String?): Optional description

**Returns**:

- `id`, `name`, `status` (always Pending on creation)

**Example**:

```typescript
const result = await apolloClient.mutate({
  mutation: CreateBuild,
  variables: { name: "Q3 2026 Release", description: "Production run" },
});
// result.data.createBuild.id ← new build ID
```

---

### UpdateBuildStatus

Update build workflow status (Pending → Running → Complete/Failed).

**Parameters**:

- `id` (ID!): Build UUID
- `status` (BuildStatus!): New status enum (Pending|Running|Complete|Failed)

**Returns**:

- `id`, `status`, `updatedAt`

**Usage**:

```typescript
await apolloClient.mutate({
  mutation: UpdateBuildStatus,
  variables: { id: "build-123", status: "Running" },
});
// Triggers buildStatusUpdated subscription on all subscribers
```

**Side Effects**:

- Emits `BuildStatusUpdated` subscription event
- Updates `updatedAt` timestamp

---

### AddPart

Add component/part to a build.

**Parameters**:

- `buildId` (ID!): Parent build UUID
- `name` (String!): Part name (1-256 chars)
- `sku` (String!): Unique SKU code
- `quantity` (Decimal!): Fractional quantity support (e.g., 2.5 units)

**Returns**:

- `id`, `buildId`, `name`, `sku`, `quantity`

**Example**:

```typescript
await apolloClient.mutate({
  mutation: AddPart,
  variables: {
    buildId: "build-123",
    name: "Precision Bearing",
    sku: "SKU-PB-001",
    quantity: 5.5, // Decimal precision supported
  },
});
```

**Note**: Quantity supports fractional values for parts that don't divide evenly.

---

### SubmitTestRun

Record test execution results (status: Passed|Failed|Running).

**Parameters**:

- `buildId` (ID!): Associated build UUID
- `status` (TestStatus!): Passed|Failed|Running
- `result` (String?): Test output/error message
- `fileUrl` (String?): Link to test report file

**Returns**:

- `id`, `status`, `result`, `completedAt` (timestamp)

**Example**:

```typescript
await apolloClient.mutate({
  mutation: SubmitTestRun,
  variables: {
    buildId: "build-123",
    status: "Passed",
    result: "All 150 assertions passed",
    fileUrl: "https://reports.example.com/test-123.json",
  },
});
// Triggers testRunCompleted subscription
```

---

## Subscriptions

Real-time updates via WebSocket. Use `bufferTime(250ms)` in Angular for high-frequency updates.

### BuildStatusUpdated

Emitted when build status changes (Pending → Running → Complete/Failed).

**Parameters**:

- `buildId` (ID!): Filter by build

**Emits**:

- `buildId` (ID!): Which build changed
- `oldStatus` (BuildStatus): Previous status
- `newStatus` (BuildStatus): Current status
- `timestamp` (DateTime): When change occurred

**Usage** (Angular service):

```typescript
// In BuildStatusService
buildStatusUpdated$ = this.apollo
  .subscribe({
    query: BuildStatusUpdated,
    variables: { buildId },
  })
  .pipe(
    map((result) => result.data.buildStatusUpdated),
    bufferTime(250), // Aggregate rapid updates
    filter((updates) => updates.length > 0),
  );
```

**Frontend Integration**: BuildProgressCardComponent subscribes via BuildStatusService.

---

### TestRunCompleted

Emitted when test execution finishes (status changes from Running to Passed/Failed).

**Parameters**:

- `buildId` (ID!): Filter by build

**Emits**:

- `testRunId` (ID!): Completed test run UUID
- `buildId` (ID!): Parent build UUID
- `status` (TestStatus): Final status (Passed|Failed)
- `timestamp` (DateTime): Completion time

**Example**:

```typescript
testRunCompleted$ = this.apollo.subscribe({
  query: TestRunCompleted,
  variables: { buildId: "build-123" },
});

testRunCompleted$.subscribe((event) => {
  console.log(`Test ${event.testRunId} completed: ${event.status}`);
});
```

---

## Type Safety

All queries/mutations/subscriptions generate TypeScript interfaces in `graphql.ts`:

```typescript
// Auto-generated in graphql.ts
export interface GetBuildQuery {
  build: {
    id: string;
    name: string;
    status: BuildStatus;
    parts: Array<{ id: string; name: string; sku: string; quantity: number }>;
    // ... etc
  };
}

export type BuildStatus = "Pending" | "Running" | "Complete" | "Failed";
```

Services import and use these types:

```typescript
// backend/BuildStatusService (example usage)
const result = await this.apollo.query<GetBuildQuery>({
  query: GetBuild,
  variables: { id },
});

const build: GetBuildQuery["build"] = result.data.build; // ✓ Type-safe
```

---

## Performance Notes

### Query Depth Limit

Max nesting: **5 layers**. If query exceeds this, break into separate requests:

```graphql
# ❌ Bad (6 layers deep)
query {
  build {
    parts {
      testRuns {
        results {
          measurements {
            values  # 6 layers
          }
        }
      }
    }
  }
}

# ✅ Good (split into two queries)
query GetBuild { build { parts { id } } }
query GetTestRuns($partId: ID!) { testRuns(partId: $partId) { ... } }
```

### Subscription Buffering

High-frequency updates (>10/sec) use `bufferTime(250)` to aggregate:

```typescript
buildStatusUpdated$
  .pipe(
    bufferTime(250), // Wait 250ms between emits
    filter((updates) => updates.length > 0),
    map((updates) => updates[updates.length - 1]), // Use latest
  )
  .subscribe((update) => this.onStatusChange(update));
```

### Backend: DataLoaders & Projections

Backend optimizes queries with:

- **DataLoaders**: Batch-load related entities (build → parts → test runs)
- **Projections**: Select only needed fields in SQL SELECT clause

Result: No N+1 queries, optimized SQL, fast GraphQL response times.

---

## Testing Queries

**HTTP Client Testing** (JetBrains IDE):

See `docs/HTTP-CLIENT-TESTING-GUIDE.md` for .http request templates.

```http
### Get single build
POST http://localhost:5275/graphql
Content-Type: application/json

query GetBuild($id: ID!) {
  build(id: $id) { id name status createdAt }
}
```

---

## See Also

- **Design System**: {@link docs/FRONTEND-DESIGN-SYSTEM.md}
- **Type Safety**: Generated types from backend schema (auto-emitted)
- **Services**: `frontend/src/app/api/build-status.service.ts` (reference implementation)
- **Backend Resolvers**: `backend/src/FactoryApp.GraphQL/` (query/mutation/subscription definitions)
