namespace FactoryApp.Workflows.WorkflowDefinitions;

/// <summary>
/// BuildProcessWorkflow - Phase 3 Implementation
///
/// BLOCKED: Requires Elsa v3.6+ (currently on v3.5.3)
///
/// This workflow orchestrates: Build → Validate Parts → Trigger Tests → Await Completion → Publish Status
///
/// Follows primitive-key-only pattern (CLAUDE.md):
/// - Only BuildId (Guid string) in workflow state
/// - Fresh DB queries per activity (no stale objects)
/// - Version isolation allows safe schema evolution
///
/// ## Upgrade Path: Elsa v3.6+
///
/// When Elsa v3.6+ available:
/// 1. Update FactoryApp.Workflows.csproj: Version="3.6.0" or later
/// 2. Replace this placeholder with fluent builder:
///    ```csharp
///    public class BuildProcessWorkflow : WorkflowBase
///    {
///        public override string Name => "BuildProcessWorkflow";
///        public override int Version => 1;
///
///        protected override void Build(IWorkflowBuilder builder)
///        {
///            builder.Root = new Sequence
///            {
///                Activities = new List<Activity>
///                {
///                    new GetBuildActivity { BuildId = new Input<string>(...) },
///                    new ProcessPartsActivity { BuildId = new Input<string>(...) },
///                    new TriggerTestRunActivity { BuildId = new Input<string>(...) },
///                    new AwaitTestCompletionActivity { TestRunId = new Input<string>(...) },
///                    new PublishBuildStatusActivity { BuildId = new Input<string>(...) }
///                }
///            };
///        }
///    }
///    ```
/// 3. Create BuildProcessCompensationWorkflow (similar pattern)
/// 4. Run: `dotnet build && dotnet test`
/// 5. Unblock Phase 4-6
///
/// See: gh-issue-draft-3.md for full implementation spec
/// Blocks: #170, #171, #172 (Phase 4-6)
/// </summary>
public class BuildProcessWorkflow
{
    // Placeholder for Elsa v3.6+ fluent workflow definition
    // Phase 3 implementation deferred until Elsa v3.6 released
}
