using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using HotChocolate;
using HotChocolate.Execution;

namespace FactoryApp.GraphQL.Types;

[GraphQLType("Build")]
public class BuildType
{
    [GraphQLField]
    public Guid Id { get; set; }

    [GraphQLField]
    public string Name { get; set; } = null!;

    [GraphQLField]
    public string? Description { get; set; }

    [GraphQLField]
    public string Status { get; set; } = null!;

    [GraphQLField]
    public DateTime CreatedAt { get; set; }

    [GraphQLField]
    public DateTime UpdatedAt { get; set; }

    [GraphQLField]
    public async Task<List<Part>> Parts(
        [Parent] Build build,
        [DataLoader("GetPartsByBuildId")] IDataLoader<Guid, List<Part>> loader)
        => await loader.LoadAsync(build.Id);

    [GraphQLField]
    public async Task<List<TestRun>> TestRuns(
        [Parent] Build build,
        [DataLoader("GetTestRunsByBuildId")] IDataLoader<Guid, List<TestRun>> loader)
        => await loader.LoadAsync(build.Id);
}
