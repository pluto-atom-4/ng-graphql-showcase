# ADR 001: Isolate Elsa v3 Workflows in Dedicated Layer

**Status:** Accepted

**Date:** 2026-06-30

**Authors:** @pluto-atom-4

---

## Problem Statement

Full-stack manufacturing workflow platform needs long-running workflow orchestration for complex manufacturing processes (Build → Parts → TestRun → Release). Decision required on where to place Elsa v3 workflow engine within layered architecture to minimize coupling, enable independent deployment, and maintain type safety.

## Decision

**Isolate Elsa v3 workflows in a dedicated `FactoryApp.Workflows` layer** that:

1. Sits between WebApi/GraphQL and Domain (not in Domain, not mixed in GraphQL)
2. Only depends on Domain entities (imports IDs only)
3. Provides no GraphQL types or HTTP interfaces
4. Can be deployed independently from GraphQL service

## Rationale

### 1. Separation of Concerns

**GraphQL = Request-Response API** (stateless, immediate)

```csharp
// GraphQL: Fast, synchronous
public async Task<BuildPayload> CreateBuild(string name, ...)
    => new BuildPayload { Id = newBuild.Id };  // Responds immediately
```

**Workflows = Asynchronous Orchestration** (stateful, long-running)

```csharp
// Workflow: Can pause/resume, hours/days execution
activity BuildProcessWorkflow:
    step CreateBuild → step ProcessParts → step RunTests → Release
```

Mixing these creates:

- GraphQL resolvers becoming async state machines
- Workflow state bleeding into HTTP response cycles
- Testing complexity (transient vs. persistent state)

**Isolation solution:** Separate services handle separate concerns.

### 2. Independent Deployment

Current architecture:

- **Fast deployments:** GraphQL + UI (seconds)
- **Complex deployments:** Elsa workflows (risk of cache invalidation, state corruption)

With Workflows isolated:

- Deploy GraphQL changes (hot fix) without restarting Elsa
- Deploy workflow logic independently; GraphQL unaffected
- Enables canary deployments, blue-green per service

### 3. State Management Safety

**Problem with storing complex objects in Elsa state:**

```csharp
// ❌ BAD: Workflow stores full Build entity
var build = await dbContext.Builds.FindAsync(buildId);
workflowContext.SetVariable("Build", build);

// Hours later... workflow wakes up
var build = workflowContext.GetVariable<Build>("Build");  // Stale!
// - Related entities haven't changed
// - Optimistic lock conflicts possible
// - Concurrency issues
```

**Solution with Workflows layer:**

```csharp
// ✅ CORRECT: Workflow stores only ID
workflowContext.SetVariable("BuildId", buildId);

// In activity (each step):
var buildId = context.GetVariable<Guid>("BuildId");
var build = await dbContext.Builds.FindAsync(buildId);  // Fresh!
```

Activities in dedicated layer make this pattern **explicit and verifiable:**

```csharp
namespace FactoryApp.Workflows.Activities;
public class ProcessPartActivity : Activity
{
    private readonly FactoryDbContext _context;

    protected override async ValueTask<IActivityExecutionResult> OnExecuteAsync(...)
    {
        var buildId = context.GetVariable<Guid>("BuildId");  // Only ID
        var build = await _context.Builds.FindAsync(buildId);  // Always fresh
        // Process...
    }
}
```

Code review can verify: "No entities stored in workflow state."

### 4. Testing Strategy

**Unit tests:** Test activities in isolation (mock DbContext)

```csharp
public async Task ProcessPartActivity_WithValidBuildId_UpdatesStatus()
{
    var mockContext = new Mock<FactoryDbContext>();
    var activity = new ProcessPartActivity(mockContext.Object);
    // Test...
}
```

**Integration tests:** Run against TestDatabaseFixture

```csharp
public async Task EndToEndWorkflow_BuildToRelease()
{
    var fixture = new TestDatabaseFixture();
    await fixture.InitializeAsync();

    // Trigger workflow → verify end state in DB
}
```

Isolated layer makes both strategies clean and testable.

### 5. Development Velocity

**Scenario 1: Fix GraphQL field naming**

```csharp
// Without isolation (Elsa in GraphQL layer):
// - Must restart Elsa
// - All in-progress workflows pause
// - State checkpoints may be incompatible
// - Manual recovery procedures needed

// With Workflows isolated:
// - Deploy GraphQL changes
// - Elsa continues processing; unaffected
// - Velocity: 1 minute vs. 30 minutes
```

**Scenario 2: Add new Elsa activity**

```csharp
// Without isolation:
// - Changes ripple to GraphQL types, mutations
// - Need to understand GraphQL schema changes
// - Risk of breaking queries

// With Workflows isolated:
// - Add activity to FactoryApp.Workflows
// - No GraphQL changes needed
// - Existing queries/mutations unaffected
```

## Consequences

### Benefits

✅ **Type Safety:** Workflows use primitives (Guid, string) only; fresh data fetches prevent stale reads

✅ **Independent Deployment:** GraphQL updates don't interrupt long-running workflows

✅ **Testability:** Unit test activities; integration test workflow orchestration separately

✅ **Maintainability:** Clear responsibility: GraphQL = request/response; Workflows = orchestration

✅ **Scalability:** Can run workflows on separate container/pod from GraphQL

### Drawbacks

❌ **Initial Complexity:** Requires new activity pattern and IAsyncLifetime fixtures

❌ **Coordination Overhead:** Workflows must trigger mutations via repository, not resolver calls

❌ **State Reconciliation:** Must handle cases where workflow state and DB diverge

### Mitigations

- **Complexity:** Document with examples (see `docs/DEVELOPMENT.md#workflow-integration`)
- **Coordination:** Create workflow service layer to encapsulate mutation calls
- **Reconciliation:** Use compensation workflows for rollback on failure; log all state transitions

## Alternatives Considered

### 1. Put Elsa in GraphQL Layer

**Approach:** Extend BuildMutationType with @Subscribe for workflow events

**Disadvantages:**

- GraphQL becomes a state machine
- Long-running operations block HTTP responses
- Can't scale independently
- Testing becomes coupled to GraphQL mocking

**Rejected:** Violates separation of concerns.

### 2. Put Elsa in Domain Layer

**Approach:** Workflows own entities and business logic

**Disadvantages:**

- Domain becomes coupled to workflow engine
- Elsa as hard dependency; can't remove/swap
- Migrations become workflow-aware
- Violates layered architecture (Domain should be framework-agnostic)

**Rejected:** Violates architecture principles.

### 3. Microservice (Separate Deployment)

**Approach:** Workflows run in separate process; communicate via gRPC/HTTP

**Advantages:**

- Maximum isolation; can scale independently
- Clear process boundaries

**Disadvantages:**

- Network overhead; distributed transactions harder
- Adds operational complexity (orchestration, monitoring)
- Solo developer project; not warranted yet

**Deferred:** Monolithic for now; can split later if needed.

## Implementation Status

✅ **Complete:**

- Elsa isolated in `FactoryApp.Workflows` layer
- Activities use primitive state (Guid, string only)
- Fresh data fetch pattern documented
- Test fixtures updated to support both patterns

**Current Code:**

```
backend/
├── src/
│   ├── FactoryApp.Domain/        # Entities, migrations
│   ├── FactoryApp.GraphQL/       # Resolvers, DTOs
│   ├── FactoryApp.Workflows/     # Activities (ISOLATED)
│   └── FactoryApp.WebApi/        # ASP.NET Core entry point
└── FactoryApp.Tests/             # Integration tests
```

## References

- [CLAUDE.md - Workflow Integration Rules](../../CLAUDE.md)
- [docs/DEVELOPMENT.md - Test Patterns](../DEVELOPMENT.md#backend-test-architecture)
- [CONTRIBUTING.md - Dependency Layers](../../CONTRIBUTING.md#dependency-layers)
- [database-rules.md - Transaction Pattern](./.claude/rules/database-rules.md)
- [Elsa v3 Documentation](https://docs.elsa-workflows.io/)

## Decision Record Approval

| Role   | Name          | Date       | Status      |
| ------ | ------------- | ---------- | ----------- |
| Author | @pluto-atom-4 | 2026-06-30 | ✅ Approved |

---

## Notes

This ADR documents the architectural decision made during issue #138 (dependency gaps analysis and phase 3 implementation). See [issue #138](https://github.com/pluto-atom-4/ng-graphql-showcase/issues/138) for implementation details and related commits.

**Key Commits:**

- `6c7be6f` — Updated test project dependencies
- `edcdaa8` — Migrated tests to real SQL Server
