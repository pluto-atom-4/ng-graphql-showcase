# Elsa Workflows v3.5.3 Integration (Phase 5c)

## Workflow State Management

Store **only primitive keys** (Guid, string) in workflow variables. Fetch fresh domain state on activity execution.

```csharp
// ❌ Bad: Storing complex object
var build = await context.Builds.FindAsync(buildId);
workflowState.SetVariable("CurrentBuild", build); // Stale!

// ✅ Good: Store key, fetch fresh in activity
workflowState.SetVariable("BuildId", buildId);

// In activity execution:
var build = await dbContext.Builds.FindAsync(workflowState.GetVariable<Guid>("BuildId"));
// Fresh data guaranteed
```

## Why

- Workflow state is persisted separately from domain database
- Object graphs become stale quickly in long-running workflows
- Activities execute asynchronously, potentially hours/days apart
- Fetching fresh ensures consistency and prevents concurrency issues

## Workflow Execution Best Practices

- Treat activities as stateless handlers
- Pass only IDs/GUIDs through workflow variables
- Query fresh data at each step
- Use compensation workflows for rollback on failure
- Log state transitions for auditability

## Phase 5c MVP Implementation

**Current State (PR #176):**

- Elsa 3.5.3 framework integrated
- Workflows execute asynchronously via `IWorkflowRuntime`
- Activities registered via `AddActivitiesFrom<Program>()`
- **State persistence:** In-memory only (state lost on app restart)

**Why In-Memory MVP?**

- SQL Server persistence extension methods unavailable in both Elsa 3.5.3 and 3.7.1
- `UseEntityFrameworkCore()` method not available on IModule type
- Custom DbContext registration required for production persistence (Phase 5d)

**Production Persistence (Future):**

```csharp
// Phase 5d: Custom EF Core DbContext for Elsa workflow persistence
// Will require direct DbContext configuration without relying on extension methods
// Alternative: Use workflow event system to sync state with application database
```

## GraphQL Integration

Trigger workflows from GraphQL mutations:

```csharp
public async Task<BuildPayload> CreateBuild(
    string name,
    [Service] IWorkflowRuntime workflowRuntime)
{
    var build = new Build { /* ... */ };

    // Async workflow execution (fire-and-forget)
    _ = Task.Run(async () =>
    {
        var client = await workflowRuntime.CreateClientAsync("BuildProcessWorkflow");
        var result = await client.CreateAndRunInstanceAsync(
            new CreateAndRunWorkflowInstanceRequest
            {
                Input = new Dictionary<string, object> { { "BuildId", build.Id.ToString() } }
            });
    });

    return BuildPayload(build);
}
```

Note: Mutation returns immediately; workflow runs in background. Client gets no notification of completion in MVP.
