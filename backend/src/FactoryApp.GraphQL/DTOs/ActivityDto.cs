namespace FactoryApp.GraphQL.DTOs;

/// <summary>
/// Phase 1 (Issue #267): Activity data transfer object.
/// Represents a recent activity from workflow history.
/// Used by GetRecentActivities query.
/// </summary>
public class ActivityDto
{
    public Guid Id { get; set; }
    public Guid WorkflowInstanceId { get; set; }
    public Guid BuildId { get; set; }
    public string EventType { get; set; } = null!;
    public string ActivityName { get; set; } = null!;
    public string OldStatus { get; set; } = null!;
    public string NewStatus { get; set; } = null!;
    public string? ErrorMessage { get; set; }
    public DateTime RecordedAt { get; set; }
    public DateTime? ExecutionStarted { get; set; }
    public DateTime? ExecutionCompleted { get; set; }
    public long? ElapsedMilliseconds { get; set; }
}
