namespace FactoryApp.GraphQL.DTOs;

/// <summary>
/// Phase 6: Workflow History DTO for GraphQL
/// Exposes workflow execution history to clients.
/// </summary>
public class WorkflowHistoryDto
{
    public Guid Id { get; set; }
    public Guid WorkflowInstanceId { get; set; }
    public Guid? BuildId { get; set; }
    public string EventType { get; set; } = null!;
    public string ActivityName { get; set; } = null!;
    public string OldStatus { get; set; } = null!;
    public string NewStatus { get; set; } = null!;
    public string? StateSnapshot { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime RecordedAt { get; set; }
    public DateTime? ExecutionStarted { get; set; }
    public DateTime? ExecutionCompleted { get; set; }
    public long? ElapsedMilliseconds { get; set; }
}
