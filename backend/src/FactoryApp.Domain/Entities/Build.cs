namespace FactoryApp.Domain.Entities;

public class Build
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public BuildStatus Status { get; set; } = BuildStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Phase 6: Workflow correlation
    public Guid? WorkflowInstanceId { get; set; } // Elsa workflow instance tracking

    // Navigation properties
    public ICollection<Part> Parts { get; set; } = new List<Part>();
    public ICollection<TestRun> TestRuns { get; set; } = new List<TestRun>();
    public ICollection<WorkflowHistoryRecord> WorkflowHistory { get; set; } = new List<WorkflowHistoryRecord>();
}

public enum BuildStatus
{
    Pending,
    Running,
    Complete,
    Failed
}
