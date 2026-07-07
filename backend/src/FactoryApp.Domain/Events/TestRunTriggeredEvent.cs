namespace FactoryApp.Domain.Events;

public class TestRunTriggeredEvent
{
    public Guid BuildId { get; set; }
    public string TestRunId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}
