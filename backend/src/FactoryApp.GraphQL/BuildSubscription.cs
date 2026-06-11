using FactoryApp.Domain.Entities;

namespace FactoryApp.GraphQL;

public class BuildSubscription
{
    // TODO: Implement real-time subscriptions using HotChocolate ITopicEventSender
    // Subscribe to build status updates via WebSocket/SSE
    // Integration point with Elsa Workflows for long-running processes

    public BuildStatusUpdate GetBuildStatus(Guid buildId)
    {
        // Placeholder: in production, this would subscribe to Elsa workflow events
        // via ITopicEventSender and emit status updates as they occur

        return new BuildStatusUpdate
        {
            Status = BuildStatus.Running,
            Progress = 50,
            TestsPassed = 5,
            TestsTotal = 10,
            Duration = 120,
            Timestamp = DateTime.UtcNow
        };
    }
}

public class BuildStatusUpdate
{
    public BuildStatus Status { get; set; }
    public int Progress { get; set; }
    public int TestsPassed { get; set; }
    public int TestsTotal { get; set; }
    public int Duration { get; set; }
    public DateTime Timestamp { get; set; }
}
