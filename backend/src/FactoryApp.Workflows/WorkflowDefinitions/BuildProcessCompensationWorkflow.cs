using Elsa.Workflows;
using Elsa.Workflows.Activities;
using FactoryApp.Workflows.Activities;

namespace FactoryApp.Workflows.WorkflowDefinitions;

/// <summary>
/// BuildProcessCompensationWorkflow - Phase 3 (Compensation/Rollback)
///
/// Implements rollback logic when BuildProcessWorkflow fails.
/// Triggered on activity failure to publish Failed status + audit log.
///
/// Compensation pattern: reverse-order activities on error
/// </summary>
public class BuildProcessCompensationWorkflow : WorkflowBase
{
    public override string Name => "BuildProcessCompensationWorkflow";
    public override string DisplayName => "Build Process Compensation Workflow";
    public override string Description => "Rollback/compensation on build processing failure";
    public override int Version => 1;

    protected override void Build(IWorkflowBuilder builder)
    {
        builder
            .Root = new Sequence
            {
                Activities = new List<Activity>
                {
                    // Publish Failed status (reverse of Released from main workflow)
                    new PublishBuildStatusActivity
                    {
                        BuildId = new Input<string>(context => context.GetInput<string>("BuildId") ?? string.Empty),
                        NewStatus = new Input<string>("Failed"),
                        OldStatus = new Input<string>("Pending")
                    }
                }
            };
    }
}
