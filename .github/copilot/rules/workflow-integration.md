---
applies_to:
  - "backend/src/**/*Workflow*.cs"
  - "backend/src/**/Activities/**/*.cs"
  - "workflows/**"
autoload: onEdit
priority: medium
---

# Workflow Integration (Elsa v3.5.3)

**Reference**: [.claude/rules/workflow-integration.md](../../.claude/rules/workflow-integration.md)

## Quick Rules

| Rule              | Enforcement                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| **State Storage** | Store ONLY primitive keys (Guid, string). Fetch fresh domain state in activities.                     |
| **Activities**    | Stateless handlers. Pass IDs through workflow variables, not objects.                                 |
| **Async**         | Use `IWorkflowRuntime`. Fire-and-forget mutations return immediately (no client notification in MVP). |
| **Compensation**  | Use compensation workflows for rollback on activity failure.                                          |
| **Persistence**   | Phase 5c MVP: In-memory only. Phase 5d: Custom EF Core DbContext (future).                            |

## Critical: Store Only Primitives

**Complex objects become stale in long-running workflows (hours/days apart). Always fetch fresh:**

```csharp
// ❌ Bad (stale object)
var build = await context.Builds.FindAsync(buildId);
workflowState.SetVariable("CurrentBuild", build);  // Stale!

// ✅ Good (fresh on each activity)
workflowState.SetVariable("BuildId", buildId);

// In activity execution:
var build = await dbContext.Builds.FindAsync(
  workflowState.GetVariable<Guid>("BuildId")
);  // Fresh data guaranteed
```

## GraphQL Mutation Integration

```csharp
public async Task<BuildPayload> CreateBuild(
    string name,
    [Service] IWorkflowRuntime workflowRuntime)
{
    var build = new Build { /* ... */ };
    await context.SaveChangesAsync();

    // Fire-and-forget workflow (async)
    _ = Task.Run(async () =>
    {
        var client = await workflowRuntime.CreateClientAsync(
            "BuildProcessWorkflow"
        );
        var result = await client.CreateAndRunInstanceAsync(
            new CreateAndRunWorkflowInstanceRequest
            {
                Input = new Dictionary<string, object>
                {
                    { "BuildId", build.Id.ToString() }
                }
            }
        );
    });

    return BuildPayload(build);  // Returns immediately
}
```

**Note**: Mutation returns before workflow completes. Client gets no completion notification (Phase 5c MVP).

## Workflow State Management

- Treat activities as **stateless handlers**
- Pass only **IDs/GUIDs** through workflow variables
- **Query fresh data** at each step
- Use **compensation workflows** for rollback on failure
- **Log state transitions** for auditability

## MVP Implementation (Phase 5c)

- Elsa 3.5.3 framework integrated ✅
- Workflows execute asynchronously via `IWorkflowRuntime` ✅
- **Persistence**: In-memory only (state lost on app restart)
- **Future** (Phase 5d): Custom DbContext for SQL Server persistence

## Essential Commands

```bash
dotnet build backend/FactoryApp.slnx         # Compiles workflows
dotnet test backend/src                      # Tests activities
dotnet watch run                             # Dev mode (restarts workflows)
```
