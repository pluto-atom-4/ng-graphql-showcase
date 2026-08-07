using FactoryApp.GraphQL.DTOs;
using HotChocolate.Types;

namespace FactoryApp.GraphQL.Types;

/// <summary>
/// Phase 2 (Issue #278): GraphQL Type for Activity Timeline
/// Defines schema for activity/workflow history events.
/// Exposes fields from ActivityDto for timeline visualization.
/// </summary>
public class ActivityType : ObjectType<ActivityDto>
{
    protected override void Configure(IObjectTypeDescriptor<ActivityDto> descriptor)
    {
        descriptor
            .Name("Activity")
            .Description("Activity timeline entry from workflow execution");

        descriptor
            .Field(x => x.Id)
            .Description("Unique activity record ID");

        descriptor
            .Field(x => x.WorkflowInstanceId)
            .Description("Associated workflow instance ID");

        descriptor
            .Field(x => x.BuildId)
            .Description("Associated build ID");

        descriptor
            .Field(x => x.EventType)
            .Description("Event type: Created, Started, ActivityExecuted, Completed, Failed, Resumed");

        descriptor
            .Field(x => x.ActivityName)
            .Description("Activity or event name for timeline display");

        descriptor
            .Field(x => x.OldStatus)
            .Description("Previous status before activity");

        descriptor
            .Field(x => x.NewStatus)
            .Description("New status after activity");

        descriptor
            .Field(x => x.ErrorMessage)
            .Description("Error message if event type is failure");

        descriptor
            .Field(x => x.RecordedAt)
            .Description("Timestamp when activity was recorded");

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
