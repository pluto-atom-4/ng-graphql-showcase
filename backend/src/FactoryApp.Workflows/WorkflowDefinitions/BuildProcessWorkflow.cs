using Elsa.Workflows;
using Elsa.Workflows.Activities;
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
/// </summary>
public class BuildProcessWorkflow : WorkflowBase
{
    public override string Name => "BuildProcessWorkflow";
    public override string DisplayName => "Build Process Workflow";
    public override string Description => "Manufacturing build lifecycle: Build → Parts → TestRun → Release";
    public override int Version => 1;

    protected override void Build(IWorkflowBuilder builder)
    {
        builder
            .Root = new Sequence
            {
                Activities = new List<Activity>
                {
                    // 1. Fetch Build from DB (input: BuildId)
                    new GetBuildActivity
                    {
                        BuildId = new Input<string>(context => context.GetInput<string>("BuildId") ?? string.Empty)
                    },

                    // 2. Validate Parts exist
                    new ProcessPartsActivity
                    {
                        BuildId = new Input<string>(context => context.GetInput<string>("BuildId") ?? string.Empty)
                    },

                    // 3. Trigger test run (generates TestRunId)
                    new TriggerTestRunActivity
                    {
                        BuildId = new Input<string>(context => context.GetInput<string>("BuildId") ?? string.Empty)
                    },

                    // 4. Await test completion
                    new AwaitTestCompletionActivity
                    {
                        TestRunId = new Input<string>(context => context.GetInput<string>("TestRunId") ?? string.Empty)
                    },

                    // 5. Publish final status (Released)
                    new PublishBuildStatusActivity
                    {
                        BuildId = new Input<string>(context => context.GetInput<string>("BuildId") ?? string.Empty),
                        NewStatus = new Input<string>("Released")
                    }
                }
            };
    }
}
