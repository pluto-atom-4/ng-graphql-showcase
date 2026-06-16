using FactoryApp.Domain.Entities;

namespace FactoryApp.GraphQL.Events;

public class TestRunCompletedEvent
{
    public Guid TestRunId { get; set; }
    public Guid BuildId { get; set; }
    public TestStatus Status { get; set; }
    public DateTime Timestamp { get; set; }
}
