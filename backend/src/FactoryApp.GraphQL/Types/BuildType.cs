using FactoryApp.Domain;
using FactoryApp.Domain.Entities;

namespace FactoryApp.GraphQL.Types;

public class BuildType
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string Status { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<Part> Parts { get; set; } = [];
    public List<TestRun> TestRuns { get; set; } = [];
}
