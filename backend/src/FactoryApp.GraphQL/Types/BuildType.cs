using FactoryApp.Domain.Entities;
using FactoryApp.GraphQL.DataLoaders;

namespace FactoryApp.GraphQL.Types;

public class BuildPayload
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string Status { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public async Task<List<Part>> GetParts(
        BuildDataLoaders dataLoaders)
        => (await dataLoaders.GetPartsByBuildId(
            new[] { Id },
            CancellationToken.None)).GetValueOrDefault(Id, []);

    public async Task<List<TestRun>> GetTestRuns(
        BuildDataLoaders dataLoaders)
        => (await dataLoaders.GetTestRunsByBuildId(
            new[] { Id },
            CancellationToken.None)).GetValueOrDefault(Id, []);
}
