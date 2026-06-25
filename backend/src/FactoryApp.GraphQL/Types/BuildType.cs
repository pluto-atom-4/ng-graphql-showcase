using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using FactoryApp.GraphQL.DataLoaders;
using HotChocolate;

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
        [Service] BuildDataLoaders dataLoaders,
        [Service] FactoryDbContext context,
        CancellationToken ct)
    {
        var parts = await dataLoaders.GetPartsByBuildId(new[] { Id }, context, ct);
        return parts.TryGetValue(Id, out var buildParts) ? buildParts : new List<Part>();
    }

    public async Task<List<TestRun>> GetTestRuns(
        [Service] BuildDataLoaders dataLoaders,
        [Service] FactoryDbContext context,
        CancellationToken ct)
    {
        var testRuns = await dataLoaders.GetTestRunsByBuildId(new[] { Id }, context, ct);
        return testRuns.TryGetValue(Id, out var buildTestRuns) ? buildTestRuns : new List<TestRun>();
    }
}
