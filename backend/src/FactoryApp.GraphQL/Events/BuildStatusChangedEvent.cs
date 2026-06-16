using FactoryApp.Domain.Entities;

namespace FactoryApp.GraphQL.Events;

public class BuildStatusChangedEvent
{
    public Guid BuildId { get; set; }
    public BuildStatus OldStatus { get; set; }
    public BuildStatus NewStatus { get; set; }
    public DateTime Timestamp { get; set; }
}
