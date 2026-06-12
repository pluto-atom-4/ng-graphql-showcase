namespace FactoryApp.Domain.Entities;

public class Build
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public BuildStatus Status { get; set; } = BuildStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Part> Parts { get; set; } = new List<Part>();
    public ICollection<TestRun> TestRuns { get; set; } = new List<TestRun>();
}

public enum BuildStatus
{
    Pending,
    Running,
    Complete,
    Failed
}
