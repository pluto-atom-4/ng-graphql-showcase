using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using FactoryApp.GraphQL.DataLoaders;
using HotChocolate;

namespace FactoryApp.GraphQL.Types;

public class BuildType
{
    public async Task<ICollection<Part>> GetParts(
        [Parent] Build build,
        [Service] BuildDataLoaders dataLoaders,
        CancellationToken ct)
    {
        var parts = await dataLoaders.GetPartsByBuildId(new[] { build.Id }, ct: ct);
        return parts.TryGetValue(build.Id, out var buildParts) ? buildParts : new List<Part>();
    }

    public async Task<ICollection<TestRun>> GetTestRuns(
        [Parent] Build build,
        [Service] BuildDataLoaders dataLoaders,
        CancellationToken ct)
    {
        var testRuns = await dataLoaders.GetTestRunsByBuildId(new[] { build.Id }, ct: ct);
        return testRuns.TryGetValue(build.Id, out var buildTestRuns) ? buildTestRuns : new List<TestRun>();
    }
}

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
        CancellationToken ct)
    {
        var parts = await dataLoaders.GetPartsByBuildId(new[] { Id }, ct: ct);
        return parts.TryGetValue(Id, out var buildParts) ? buildParts : new List<Part>();
    }

    public async Task<List<TestRun>> GetTestRuns(
        [Service] BuildDataLoaders dataLoaders,
        CancellationToken ct)
    {
        var testRuns = await dataLoaders.GetTestRunsByBuildId(new[] { Id }, ct: ct);
        return testRuns.TryGetValue(Id, out var buildTestRuns) ? buildTestRuns : new List<TestRun>();
    }
}
