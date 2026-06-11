namespace FactoryApp.Domain.Entities;

public class TestRun
{
    public Guid Id { get; set; }
    public Guid BuildId { get; set; }
    public TestStatus Status { get; set; } = TestStatus.Pending;
    public string? Result { get; set; }
    public string? FileUrl { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public Build? Build { get; set; }
}

public enum TestStatus
{
    Pending,
    Running,
    Passed,
    Failed
}
