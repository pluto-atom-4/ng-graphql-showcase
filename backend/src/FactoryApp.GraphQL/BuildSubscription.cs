using FactoryApp.Domain.Entities;
using FactoryApp.Domain.Events;
using HotChocolate;
using HotChocolate.Subscriptions;

namespace FactoryApp.GraphQL;

public class BuildSubscription
{
    public static async IAsyncEnumerable<BuildStatusUpdate> BuildStatusUpdated(
        string buildId,
        [EventMessage] BuildStatusChangedEvent message)
    {
        if (!Guid.TryParse(buildId, out var buildGuid))
        {
            yield break;
        }

        if (message.BuildId == buildGuid)
        {
            yield return new BuildStatusUpdate
            {
                BuildId = buildGuid,
                OldStatus = message.OldStatus,
                NewStatus = message.NewStatus,
                Timestamp = message.Timestamp
            };
        }
    }

    public static async IAsyncEnumerable<TestRunUpdate> TestRunCompleted(
        string buildId,
        [EventMessage] TestRunCompletedEvent message)
    {
        if (!Guid.TryParse(buildId, out var buildGuid))
        {
            yield break;
        }

        if (message.BuildId == buildGuid)
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

    public static IAsyncEnumerable<string> TestSubscriptionSync()
    {
        return GetTestMessages();
    }

    private static async IAsyncEnumerable<string> GetTestMessages()
    {
        yield return "test1";
        yield return "test2";
    }

    public static async IAsyncEnumerable<BuildStatusUpdate> AllBuildStatusUpdates(
        [EventMessage] BuildStatusChangedEvent message)
    {
        yield return new BuildStatusUpdate
        {
            BuildId = message.BuildId,
            OldStatus = message.OldStatus,
            NewStatus = message.NewStatus,
            Timestamp = message.Timestamp
        };
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
