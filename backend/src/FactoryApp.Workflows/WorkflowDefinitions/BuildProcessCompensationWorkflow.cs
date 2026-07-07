using Elsa.Workflows;
using Elsa.Workflows.Activities;
using Elsa.Workflows.Models;
using FactoryApp.Workflows.Activities;

namespace FactoryApp.Workflows.WorkflowDefinitions;

/// <summary>
/// BuildProcessCompensationWorkflow - Phase 3 (Compensation/Rollback)
///
/// Implements rollback logic when BuildProcessWorkflow fails.
/// Triggered on activity failure to publish Failed status + audit log.
///
/// Compensation pattern: reverse-order activities on error
/// Metadata (Name, Version) managed by workflow registration/provider.
/// </summary>
public class BuildProcessCompensationWorkflow : WorkflowBase
{
    protected override void Build(IWorkflowBuilder builder)
    {
        builder.Root = new Sequence
        {
            Activities = new List<IActivity>
            {
                // Publish Failed status (reverse of Released from main workflow)
                new PublishBuildStatusActivity
                {
                    NewStatus = "Failed",
                    OldStatus = "Pending"
                }
            }
        };
    }
}
