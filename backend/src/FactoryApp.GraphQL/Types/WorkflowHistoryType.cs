using FactoryApp.GraphQL.DTOs;
using HotChocolate.Types;

namespace FactoryApp.GraphQL.Types;

/// <summary>
/// Phase 6: GraphQL Type for Workflow History
/// Defines schema for workflow execution events and state transitions.
/// </summary>
public class WorkflowHistoryType : ObjectType<WorkflowHistoryDto>
{
    protected override void Configure(IObjectTypeDescriptor<WorkflowHistoryDto> descriptor)
    {
        descriptor
            .Name("WorkflowHistory")
            .Description("Workflow execution history and state transitions");

        descriptor
            .Field(x => x.Id)
            .Description("Unique history record ID");

        descriptor
            .Field(x => x.WorkflowInstanceId)
            .Description("Elsa workflow instance ID");

        descriptor
            .Field(x => x.BuildId)
            .Description("Associated build ID (if linked to workflow)");

        descriptor
            .Field(x => x.EventType)
            .Description("Event type: Created, Started, ActivityExecuted, Completed, Failed, Resumed");

        descriptor
            .Field(x => x.ActivityName)
            .Description("Activity or workflow event name");

        descriptor
            .Field(x => x.OldStatus)
            .Description("Previous workflow/activity status");

        descriptor
            .Field(x => x.NewStatus)
            .Description("New workflow/activity status");

        descriptor
            .Field(x => x.StateSnapshot)
            .Description("JSON snapshot of workflow state (if captured)");

        descriptor
            .Field(x => x.ErrorMessage)
            .Description("Error message if event type is failure");

        descriptor
            .Field(x => x.RecordedAt)
            .Description("Timestamp when event was recorded");

        descriptor
            .Field(x => x.ExecutionStarted)
            .Description("Activity execution start time");

        descriptor
            .Field(x => x.ExecutionCompleted)
            .Description("Activity execution completion time");

        descriptor
            .Field(x => x.ElapsedMilliseconds)
            .Description("Elapsed time in milliseconds for activity execution");
    }
}
