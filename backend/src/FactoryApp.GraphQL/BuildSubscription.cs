using FactoryApp.Domain.Entities;
using FactoryApp.GraphQL.Events;
using HotChocolate;
using HotChocolate.Subscriptions;

namespace FactoryApp.GraphQL;

public class BuildSubscription
{
    [Subscribe]
    public async IAsyncEnumerable<BuildStatusUpdate> BuildStatusUpdated(
        Guid buildId,
        [EventMessage] BuildStatusChangedEvent message)
    {
        if (message.BuildId == buildId)
        {
            yield return new BuildStatusUpdate
            {
                BuildId = buildId,
                OldStatus = message.OldStatus,
                NewStatus = message.NewStatus,
                Timestamp = message.Timestamp
            };
        }
    }

    [Subscribe]
    public async IAsyncEnumerable<TestRunUpdate> TestRunCompleted(
        Guid buildId,
        [EventMessage] TestRunCompletedEvent message)
    {
        if (message.BuildId == buildId)
        {
            yield return new TestRunUpdate
            {
                TestRunId = message.TestRunId,
                BuildId = message.BuildId,
                Status = message.Status,
                Timestamp = message.Timestamp
            };
        }
    }
}

public class BuildStatusUpdate
{
    public Guid BuildId { get; set; }
    public BuildStatus OldStatus { get; set; }
    public BuildStatus NewStatus { get; set; }
    public DateTime Timestamp { get; set; }
}

public class TestRunUpdate
{
    public Guid TestRunId { get; set; }
    public Guid BuildId { get; set; }
    public TestStatus Status { get; set; }
    public DateTime Timestamp { get; set; }
}
