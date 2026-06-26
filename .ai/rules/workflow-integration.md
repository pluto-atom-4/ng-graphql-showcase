# Elsa Workflows v3 Integration

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
