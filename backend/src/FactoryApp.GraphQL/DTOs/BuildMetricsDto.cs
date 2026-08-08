namespace FactoryApp.GraphQL.DTOs;

/// <summary>
/// Phase 1 (Issue #267): Build metrics aggregation.
/// Returns counts of builds by status for dashboard metrics display.
/// </summary>
public class BuildMetricsDto
{
    public int Total { get; set; }
    public int InProgress { get; set; }
    public int Completed { get; set; }
    public int Failed { get; set; }
    public int Pending { get; set; }
}
