using Elsa.Workflows;
using Elsa.Workflows.Activities;
using Elsa.Workflows.Models;
using FactoryApp.Workflows.Activities;

namespace FactoryApp.Workflows.WorkflowDefinitions;

/// <summary>
/// BuildProcessWorkflow - Phase 3 (Elsa v3.7.1)
///
/// Orchestrates manufacturing build lifecycle:
/// Build → Validate Parts → Trigger Tests → Await Completion → Publish Status
///
/// Follows primitive-key-only pattern (CLAUDE.md):
/// - Only BuildId (Guid string) in workflow state
/// - Fresh DB queries per activity execution
/// - Version isolation for schema evolution
///
/// Metadata (Name, Version) managed by workflow registration/provider.
/// </summary>
public class BuildProcessWorkflow : WorkflowBase
{
    protected override void Build(IWorkflowBuilder builder)
    {
        builder.Root = new Sequence
        {
            Activities = new List<IActivity>
            {
                // 1. Fetch Build from DB (input: BuildId)
                new GetBuildActivity(),

                // 2. Validate Parts exist
                new ProcessPartsActivity(),

                // 3. Trigger test run (generates TestRunId)
                new TriggerTestRunActivity(),

                // 4. Await test completion
                new AwaitTestCompletionActivity(),

                // 5. Publish final status (Released)
                new PublishBuildStatusActivity
                {
                    NewStatus = "Released"
                }
            }
        };
    }
}
