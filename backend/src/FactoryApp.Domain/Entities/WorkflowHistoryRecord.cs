using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FactoryApp.Domain.Entities;

/// <summary>
/// Phase 6: Workflow History Domain Model
/// Tracks workflow state transitions and activity execution history.
/// </summary>
[Table("WorkflowHistory")]
public class WorkflowHistoryRecord
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid WorkflowInstanceId { get; set; }

    [Required]
    public string EventType { get; set; } = null!; // Created, Started, ActivityExecuted, Completed, Failed

    [Required]
    public string ActivityName { get; set; } = null!; // Name of activity or workflow event

    [Required]
    public string OldStatus { get; set; } = null!; // Previous state

    [Required]
    public string NewStatus { get; set; } = null!; // New state

    public string? StateSnapshot { get; set; } // JSON snapshot of workflow state at this point

    public string? ErrorMessage { get; set; } // If failed, capture error

    [Required]
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ExecutionStarted { get; set; }
    public DateTime? ExecutionCompleted { get; set; }
    public long? ElapsedMilliseconds { get; set; }
}
